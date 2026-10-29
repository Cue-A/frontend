import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { requestAxisRetry } from '../api/reportRetryApi'
import { connectRetrySocket } from '../api/reportSocket'
import { FINAL_RETRY_ERRORS, RETRY_MESSAGES } from '../lib/analysisErrorMessage'
import type { Report, RetryAxis, RetryState } from '../types/report'

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
  /** 지금 다시 분석 중인 축들. 실패한 축은 **한 번에 같이** 돕니다. 안 돌고 있으면 빈 배열입니다 */
  running: RetryAxis[]
  /** 다시 분석한 축의 마지막 결과 */
  outcomes: RetryOutcomes
  /** 실패한 축을 전부 다시 분석합니다 */
  retry: () => void
}

type RetryRun = {
  reportId: string
  /**
   * 이 화면에서 정한 "지금 도는 축". null 이면 리포트의 `retry` 를 따릅니다 — 새로고침하거나 다른 탭에서 연
   * 화면은 리포트 응답의 `retry.status` 가 `PROCESSING` 인 것으로 도는 중인 걸 압니다.
   */
  running: RetryAxis[] | null
  outcomes: RetryOutcomes
}

const NO_AXES: RetryAxis[] = []

/** 따라잡기 조회(`catchUp`)를 몇 번까지 해 볼지와 그 사이 간격 */
const CATCH_UP_ATTEMPTS = 2
const CATCH_UP_RETRY_MS = 3000

/** 분석은 끝났는데 바뀐 리포트를 못 받아온 경우입니다. 다시 분석할 일이 아니라 새로고침하면 됩니다 */
const RELOAD_FAILED_MESSAGE = '다시 분석은 끝났는데 결과를 불러오지 못했어요. 새로고침해 주세요.'

/** 재시도 실패 문구. 우리 문구가 있으면 그걸, 없으면 서버 문구를 씁니다 */
function toRetryMessage(code: string, serverMessage?: string | null) {
  const ours = toUserMessage(code, RETRY_MESSAGES)
  return RETRY_MESSAGES[code] || !serverMessage ? ours : serverMessage
}

/** 리포트에 남은 "마지막 재시도 실패" 를 축별 결과로 옮깁니다. 새로고침해도 실패 사유가 남습니다 */
function outcomesFromReport(retry: RetryState | null): RetryOutcomes {
  if (retry?.status !== 'failed') return {}

  const outcome: RetryOutcome = {
    kind: 'failed',
    message: toRetryMessage(retry.errorCode ?? 'UNKNOWN', retry.message),
    retryable: retry.retryable,
  }
  return Object.fromEntries(retry.axes.map((axis) => [axis, outcome]))
}

/** 다시 분석할 축 — 세부 점수에서 "다시 분석" 버튼이 있는 줄들입니다 */
function failedAxesOf(report: Report | null): RetryAxis[] {
  return (report?.metrics ?? [])
    .map((metric) => metric.retryAxis)
    .filter((axis): axis is RetryAxis => axis !== null)
}

/**
 * 리포트에서 **실패한 축**을 다시 분석합니다. (Cue-A/backend#68)
 *
 * 1. 분석 등록과 같은 소켓(`/ws/reports/{reportId}`)에 **먼저** 붙습니다. 등록 뒤에 붙으면 빨리 끝난 결과를 놓칩니다
 * 2. `POST /api/reports/{reportId}/retry` 로 맡깁니다. 본문이 없고, 백엔드가 실패한 축 전부를 한 번에 돌립니다
 * 3. `report` 가 오면 리포트를 **다시 불러와** 축마다 살아났는지 봅니다. 재시도는 리포트를 통째로 바꾸므로
 *    (총점 · 상태까지) 소켓의 요약값이 아니라 새 리포트가 기준입니다. `error` 가 오면 리포트는 그대로입니다
 *
 * **이미 도는 재시도를 이어 기다립니다.** 새로고침하거나 다른 탭에서 열면 리포트의 `retry.status` 가 `PROCESSING`
 * 이고, 누르면 `REPORT_RETRY_IN_PROGRESS` 가 옵니다. 둘 다 소켓에 붙은 뒤 리포트를 한 번 다시 불러 그 사이에 끝났는지
 * 따라잡고, 아직이면 소켓을 기다립니다. 마지막 재시도가 실패한 리포트(`retry.status` `FAILED`)는 그 사유를 실패 줄에
 * 그대로 보여줍니다.
 *
 * 분석 중 화면과 같은 기다림 상한(`ANALYSIS_TIMEOUT_MS`)을 둡니다. 소켓 메시지를 놓쳐도 버튼이 영영
 * "분석 중" 으로 남지 않게 하는 안전장치입니다.
 *
 * 회차를 옮기거나 화면을 떠나면 기다림을 그만둡니다. 서버의 분석은 멈추지 않으니, 돌아왔을 때 리포트가
 * 이미 바뀌어 있을 수 있습니다.
 */
export function useAxisRetry(
  reportId: string | undefined,
  report: Report | null,
  reload: () => Promise<Report | null>,
): AxisRetry {
  const [state, setState] = useState<RetryRun | null>(null)
  /**
   * 돌고 있는 기다림을 멈추는 함수입니다. 화면에 그리는 값이 아니라서 state 가 아니라 ref 에 둡니다.
   * 한 번에 하나만 기다립니다.
   */
  const cancelRef = useRef<(() => void) | null>(null)

  const current = state?.reportId === reportId ? state : null
  const serverRetry = report?.reportId === reportId ? (report?.retry ?? null) : null
  const running =
    current?.running ?? (serverRetry?.status === 'processing' ? serverRetry.axes : NO_AXES)

  /**
   * 재시도 결과를 기다립니다. `post` 면 소켓에 붙은 뒤 등록하고, 아니면(이미 도는 중) 소켓에 붙은 뒤 리포트를
   * 한 번 다시 불러 따라잡습니다.
   */
  const watch = useCallback(
    (requested: RetryAxis[], post: boolean) => {
      if (!reportId || cancelRef.current) return

      /** 기다리는 축. 등록 응답이 오면 백엔드가 실제로 돌리는 축으로 바뀝니다 */
      let axes = requested

      let alive = true
      let disconnect = () => {}

      const stop = () => {
        alive = false
        disconnect()
        window.clearTimeout(timer)
        cancelRef.current = null
      }

      // 회차를 옮기거나 화면을 떠날 때입니다. 결과 없이 멈추고, 돌아왔을 때 리포트의 `retry` 를 다시 따르게 합니다.
      const cancel = () => {
        stop()
        setState((previous) =>
          previous?.reportId === reportId ? { ...previous, running: null } : previous,
        )
      }

      const finish = (outcomes: RetryOutcomes) => {
        if (!alive) return
        stop()
        setState((previous) => ({
          reportId,
          running: NO_AXES,
          outcomes: { ...(previous?.reportId === reportId ? previous.outcomes : {}), ...outcomes },
        }))
      }

      const finishAll = (outcome: RetryOutcome) =>
        finish(Object.fromEntries(axes.map((axis) => [axis, outcome])))

      /** 끝난 뒤의 리포트로 축마다 살아났는지 봅니다 */
      const judge = (fresh: Report) => {
        finish(
          Object.fromEntries(
            axes.map((axis) => {
              const metric = fresh.metrics.find((item) => item.key === axis)
              return [axis, metric?.status === 'ok' ? { kind: 'recovered' } : { kind: 'stillFailed' }]
            }),
          ),
        )
      }

      const reloadAndJudge = () => {
        reload().then((fresh) => {
          if (!alive) return
          if (!fresh) finishAll({ kind: 'failed', message: RELOAD_FAILED_MESSAGE, retryable: false })
          else judge(fresh)
        })
      }

      /**
       * 소켓에 붙기 전에 끝났을 수 있어서 리포트를 한 번 다시 불러 봅니다. 아직 도는 중이면 소켓을 기다립니다.
       *
       * 불러오기가 실패하면 조금 뒤 한 번 더 불러 봅니다. 그 사이 이미 끝났다면 소켓 메시지가 다시 오지 않아서,
       * 그냥 넘기면 기다림 상한(`ANALYSIS_TIMEOUT_MS`)까지 "분석 중" 으로 남습니다. (PR #120 리뷰)
       */
      const catchUp = (attempt = 1) => {
        reload().then((fresh) => {
          if (!alive) return
          if (!fresh) {
            console.error('실패 축 재시도 따라잡기 조회 실패 reportId=%s attempt=%d', reportId, attempt)
            if (attempt < CATCH_UP_ATTEMPTS) {
              window.setTimeout(() => {
                if (alive) catchUp(attempt + 1)
              }, CATCH_UP_RETRY_MS)
            }
            return
          }
          if (fresh.retry?.status === 'processing') return
          if (fresh.retry?.status === 'failed') {
            finish(outcomesFromReport(fresh.retry))
            return
          }
          judge(fresh)
        })
      }

      cancelRef.current = cancel
      setState((previous) => {
        const outcomes = { ...(previous?.reportId === reportId ? previous.outcomes : {}) }
        axes.forEach((axis) => delete outcomes[axis])
        return { reportId, running: axes, outcomes }
      })

      const timer = window.setTimeout(() => {
        console.error('실패 축 재시도 기다림 상한 초과 reportId=%s', reportId)
        finishAll({ kind: 'failed', message: toUserMessage('AI_TIMEOUT', RETRY_MESSAGES), retryable: true })
      }, ANALYSIS_TIMEOUT_MS)

      disconnect = connectRetrySocket(reportId, {
        // 단계는 그리지 않습니다. 재시도는 앞 단계를 캐시로 건너뛰어서 단계 이름이 실제 일과 맞지 않습니다.
        onProgress: () => {},
        onReport: () => {
          if (alive) reloadAndJudge()
        },
        onError: (push) => {
          console.error('실패 축 재시도 실패 code=%s retryable=%s', push.errorCode, push.retryable)
          finishAll({
            kind: 'failed',
            message: toRetryMessage(push.errorCode, push.message),
            retryable: push.retryable,
          })
        },
      })

      if (!post) {
        catchUp()
        return
      }

      requestAxisRetry(reportId)
        .then((response) => {
          if (!alive) return
          // 백엔드가 실제로 돌리는 축으로 맞춥니다. 화면이 본 실패 축과 같아야 정상입니다
          const actual = (response.retry?.axes ?? []).filter(
            (axis): axis is RetryAxis => axis === 'speech' || axis === 'gaze',
          )
          if (actual.length > 0) {
            axes = actual
            setState((previous) =>
              previous?.reportId === reportId ? { ...previous, running: actual } : previous,
            )
          }
        })
        .catch((cause: unknown) => {
          if (!alive) return
          const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'

          // 다른 탭이나 새로고침 전에 누른 재시도가 도는 중입니다. 실패가 아니라 그 결과를 같이 기다립니다
          if (code === 'REPORT_RETRY_IN_PROGRESS') {
            catchUp()
            return
          }

          console.error('실패 축 재시도 등록 실패 code=%s', code)
          finishAll({
            kind: 'failed',
            message: toRetryMessage(code),
            retryable: !FINAL_RETRY_ERRORS.has(code),
          })
          // 다시 분석할 수 없는 리포트면 다른 곳에서 이미 다 살아났을 수 있어서 최신 리포트로 바꿔 둡니다
          if (code === 'REPORT_NOT_RETRYABLE') void reload()
        })
    },
    [reportId, reload],
  )

  // 화면을 떠나거나 회차를 옮기면 기다림을 그만둡니다.
  useEffect(() => () => cancelRef.current?.(), [reportId])

  // 새로고침 · 다른 탭: 리포트가 "다시 분석 중" 으로 오면 이어서 기다립니다. 이 화면에서 정한 상태가 있으면 그걸 따릅니다.
  const resumeAxes = current?.running == null && serverRetry?.status === 'processing' ? serverRetry.axes : null
  const resumeKey = resumeAxes?.join(',') ?? ''
  useEffect(() => {
    if (!resumeKey) return
    watch(resumeKey.split(',') as RetryAxis[], false)
  }, [resumeKey, watch])

  const retry = useCallback(() => {
    if (running.length > 0) return
    const axes = failedAxesOf(report)
    if (axes.length === 0) return
    watch(axes, true)
  }, [running, report, watch])

  return {
    running,
    outcomes: { ...outcomesFromReport(serverRetry), ...(current?.outcomes ?? {}) },
    retry,
  }
}
