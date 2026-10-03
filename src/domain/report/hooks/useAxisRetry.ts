import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { requestAxisRetry } from '../api/reportRetryApi'
import { connectRetrySocket } from '../api/reportSocket'
import { FINAL_RETRY_ERRORS, RETRY_MESSAGES } from '../lib/analysisErrorMessage'
import type { Report, RetryAxis } from '../types/report'

import { ANALYSIS_TIMEOUT_MS } from './useAnalysisProgress'

/** 다시 분석한 축 하나의 마지막 결과입니다. */
export type RetryOutcome =
  /** 점수를 받았습니다. 리포트는 이미 새 값으로 바뀌어 있습니다 */
  | { kind: 'recovered' }
  /** 끝까지 돌았지만 이번에도 그 축이 실패했습니다. 다시 누를 수 있습니다 */
  | { kind: 'stillFailed' }
  /** 등록 · 진행 중에 멈췄습니다. `retryable` 이 false 면 다시 눌러도 결과가 같습니다 */
  | { kind: 'failed'; message: string; retryable: boolean }

export type RetryOutcomes = Partial<Record<RetryAxis, RetryOutcome>>

export type AxisRetry = {
  /** 지금 다시 분석 중인 축. **한 번에 하나만** 돕니다 */
  running: RetryAxis | null
  /** 이 회차에서 다시 분석한 축의 마지막 결과 */
  outcomes: RetryOutcomes
  retry: (axis: RetryAxis) => void
}

type RetryState = {
  reportId: string
  running: RetryAxis | null
  outcomes: RetryOutcomes
}

const NO_OUTCOMES: RetryOutcomes = {}

/** 분석은 끝났는데 바뀐 리포트를 못 받아온 경우입니다. 다시 분석할 일이 아니라 새로고침하면 됩니다 */
const RELOAD_FAILED_MESSAGE = '다시 분석은 끝났는데 결과를 불러오지 못했어요. 새로고침해 주세요.'

/**
 * 리포트에서 **실패한 축만** 다시 분석합니다. (AI 계약 14장 · 백엔드 API 는 아직 없음 — `reportRetryApi.ts`)
 *
 * 1. `POST /api/reports/{reportId}/retry` 로 그 축 하나를 맡깁니다
 * 2. 분석 등록과 같은 소켓(`/ws/reports/{reportId}`)에서 `report` · `error` 를 기다립니다
 * 3. `report` 가 오면 리포트를 **다시 불러와** 그 축이 살아났는지 봅니다. 재시도는 리포트를 통째로
 *    바꾸므로(총점 · 상태까지) 소켓의 요약값이 아니라 새 리포트가 기준입니다
 *
 * 한 번에 한 축만 돌립니다. 같은 리포트를 동시에 두 번 다시 만들면 나중에 끝난 쪽이 먼저 끝난 쪽 결과를
 * 덮어써서, 살아난 축이 다시 실패로 돌아갈 수 있습니다.
 *
 * 분석 중 화면과 같은 기다림 상한(`ANALYSIS_TIMEOUT_MS`)을 둡니다. 소켓 메시지를 놓쳐도 버튼이 영영
 * "분석 중" 으로 남지 않게 하는 안전장치입니다.
 *
 * 회차를 옮기거나 화면을 떠나면 기다림을 그만둡니다. 서버의 분석은 멈추지 않으니, 돌아왔을 때 리포트가
 * 이미 바뀌어 있을 수 있습니다.
 */
export function useAxisRetry(
  reportId: string | undefined,
  reload: () => Promise<Report | null>,
): AxisRetry {
  const [state, setState] = useState<RetryState | null>(null)
  /**
   * 돌고 있는 재시도를 멈추는 함수들입니다. 화면에 그리는 값이 아니라서 state 가 아니라 ref 에 둡니다.
   * Set 하나를 계속 쓰므로 effect 정리에서 그대로 꺼내 써도 됩니다.
   */
  const runsRef = useRef(new Set<() => void>())

  useEffect(() => {
    const runs = runsRef.current
    return () => runs.forEach((cancel) => cancel())
  }, [reportId])

  const retry = useCallback(
    (axis: RetryAxis) => {
      const runs = runsRef.current
      if (!reportId || runs.size > 0) return

      let alive = true
      let disconnect = () => {}

      const stop = () => {
        alive = false
        disconnect()
        window.clearTimeout(timer)
        runs.delete(cancel)
      }

      // 회차를 옮기거나 화면을 떠날 때입니다. 결과 없이 멈추고, 돌아왔을 때 버튼이 묶여 있지 않게 풉니다.
      const cancel = () => {
        stop()
        setState((previous) =>
          previous?.reportId === reportId && previous.running === axis
            ? { ...previous, running: null }
            : previous,
        )
      }

      const finish = (outcome: RetryOutcome) => {
        if (!alive) return
        stop()
        setState((previous) => ({
          reportId,
          running: null,
          outcomes: { ...(previous?.reportId === reportId ? previous.outcomes : {}), [axis]: outcome },
        }))
      }

      runs.add(cancel)
      setState((previous) => {
        const outcomes = { ...(previous?.reportId === reportId ? previous.outcomes : {}) }
        delete outcomes[axis]
        return { reportId, running: axis, outcomes }
      })

      const timer = window.setTimeout(() => {
        console.error('부분 재시도 기다림 상한 초과 reportId=%s axis=%s', reportId, axis)
        finish({ kind: 'failed', message: toUserMessage('AI_TIMEOUT', RETRY_MESSAGES), retryable: true })
      }, ANALYSIS_TIMEOUT_MS)

      requestAxisRetry(reportId, [axis])
        .then(() => {
          if (!alive) return

          disconnect = connectRetrySocket(reportId, {
            // 단계는 그리지 않습니다. 재시도는 앞 단계를 캐시로 건너뛰어서 단계 이름이 실제 일과 맞지 않습니다.
            onProgress: () => {},
            onReport: () => {
              reload().then((fresh) => {
                if (!fresh) {
                  finish({ kind: 'failed', message: RELOAD_FAILED_MESSAGE, retryable: false })
                  return
                }
                const metric = fresh.metrics.find((item) => item.key === axis)
                finish(metric?.status === 'ok' ? { kind: 'recovered' } : { kind: 'stillFailed' })
              })
            },
            onError: (push) => {
              console.error('부분 재시도 실패 code=%s retryable=%s', push.errorCode, push.retryable)
              finish({
                kind: 'failed',
                message: toUserMessage(push.errorCode, RETRY_MESSAGES),
                retryable: push.retryable,
              })
            },
          })
        })
        .catch((cause: unknown) => {
          const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
          console.error('부분 재시도 등록 실패 code=%s', code)
          finish({
            kind: 'failed',
            message: toUserMessage(code, RETRY_MESSAGES),
            retryable: !FINAL_RETRY_ERRORS.has(code),
          })
        })
    },
    [reportId, reload],
  )

  const current = state?.reportId === reportId ? state : null

  return {
    running: current?.running ?? null,
    outcomes: current?.outcomes ?? NO_OUTCOMES,
    retry,
  }
}
