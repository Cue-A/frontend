import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { ReportErrorPush } from '../types/analysis'
import type { RetryAxis } from '../types/report'

import { MOCK_REPORT_IDS, mockRetryTarget, recoverMockAxes, setMockRetry } from './reportMock'
import type { ReportSocketHandlers } from './reportRequestMock'

/**
 * 실패 축 재시도 등록과 그 결과 소켓 목업입니다. (Cue-A/backend#68)
 *
 * 실제 서버처럼 본문 없이 받고, 리포트의 **실패한 축 전부**를 한 번에 다시 분석합니다.
 *
 * | 리포트 | 다시 분석하면 |
 * |---|---|
 * | `latest` · 그 밖 | 4초 뒤 시선이 살아납니다. 총점 · 상태가 바뀝니다 |
 * | `bothFailed` 첫 번째 | 소켓 `error`(`AI_TIMEOUT`, 다시 요청 가능). 리포트는 그대로이고 `retry.status` 가 `FAILED` |
 * | `bothFailed` 두 번째 | 끝까지 돌지만 **시선만** 살아나고 말하기는 또 실패(리포트는 `PARTIAL` 그대로) |
 * | `bothFailed` 세 번째 | 말하기도 살아나 `COMPLETED` |
 *
 * 도는 동안 상세 조회의 `retry` 가 `PROCESSING` 이고, 그때 또 누르면 409 `REPORT_RETRY_IN_PROGRESS` 입니다.
 * `PARTIAL` 이 아닌 리포트는 409 `REPORT_NOT_RETRYABLE` 입니다.
 *
 * 결과는 실제 서버처럼 **그 순간 붙어 있는 소켓에만** 보냅니다. 몇 번째인지 · 도는 중인지는 메모리에만 셉니다 —
 * 새로고침하면 처음부터입니다.
 *
 * **진행 단계(`progress`)는 흘리지 않습니다.** 재시도는 앞 단계를 캐시로 건너뛰어서 화면이 단계 막대를 그리지
 * 않습니다(`useAxisRetry` 의 `onProgress` 가 빈 함수). (PR #92 리뷰)
 */

/** 재시도가 끝나기까지 걸리는 시간 */
const RETRY_MS = 4000

/** reportId 별 몇 번째 재시도인지 */
const attempts = new Map<string, number>()

/** reportId 별로 지금 붙어 있는 소켓들입니다 */
const listeners = new Map<string, Set<ReportSocketHandlers>>()

type MockOutcome =
  /** 이 축들이 살아납니다. 나머지 실패 축은 또 실패합니다 */
  | { kind: 'done'; recovered: RetryAxis[] }
  | { kind: 'error'; error: ReportErrorPush }

function toOutcome(reportId: string, axes: RetryAxis[], attempt: number): MockOutcome {
  if (reportId !== MOCK_REPORT_IDS.bothFailed) return { kind: 'done', recovered: axes }

  if (attempt === 1) {
    return {
      kind: 'error',
      // 실제 서버 문구는 ReportFailurePolicy.retryMessageOf 입니다. 화면은 errorCode 로 우리 문구를 고릅니다
      error: { errorCode: 'AI_TIMEOUT', message: 'AI 서버 응답 시간이 초과되었습니다', retryable: true },
    }
  }
  if (attempt === 2) return { kind: 'done', recovered: axes.filter((axis) => axis === 'gaze') }
  return { kind: 'done', recovered: axes }
}

function broadcast(reportId: string, send: (handlers: ReportSocketHandlers) => void) {
  listeners.get(reportId)?.forEach(send)
}

registerMock('POST', '/api/reports/:reportId/retry', ({ reportId }) => {
  const target = mockRetryTarget(reportId)
  if (target.status !== 'PARTIAL' || target.axesFailed.length === 0) {
    throw new ApiError('REPORT_NOT_RETRYABLE', '다시 분석할 수 없는 리포트입니다')
  }
  if (target.retry?.status === 'PROCESSING') {
    throw new ApiError('REPORT_RETRY_IN_PROGRESS', '이미 다시 분석하고 있습니다')
  }

  const axes = target.axesFailed
  const attempt = (attempts.get(reportId) ?? 0) + 1
  attempts.set(reportId, attempt)

  const processing = { status: 'PROCESSING', axes, errorCode: null, message: null, retryable: null }
  setMockRetry(reportId, processing)

  // 실제 서버의 폴러처럼 소켓이 붙어 있든 없든 돌고, 끝난 순간 붙어 있는 소켓에만 알립니다
  setTimeout(() => {
    const outcome = toOutcome(reportId, axes, attempt)

    if (outcome.kind === 'error') {
      setMockRetry(reportId, { ...processing, status: 'FAILED', ...outcome.error })
      broadcast(reportId, (handlers) => handlers.onError(outcome.error))
      return
    }

    recoverMockAxes(reportId, outcome.recovered)
    // 끝까지 돌았으면 축이 또 실패해도 재시도는 "성공" 이라 `retry` 가 null 이 됩니다 (리포트는 PARTIAL 로 남음)
    setMockRetry(reportId, null)
    const after = mockRetryTarget(reportId)
    broadcast(reportId, (handlers) =>
      handlers.onReport({ reportId, status: after.status, scoreTotal: after.totalScore }),
    )
  }, RETRY_MS)

  return { reportId, status: target.status, retry: processing }
})

/** 재시도 결과를 받는 소켓입니다. 붙어 있는 동안 그 리포트의 결과를 받습니다. 반환값은 정리 함수입니다 */
export function connectMockRetrySocket(reportId: string, handlers: ReportSocketHandlers): () => void {
  const set = listeners.get(reportId) ?? new Set<ReportSocketHandlers>()
  set.add(handlers)
  listeners.set(reportId, set)

  return () => {
    set.delete(handlers)
  }
}
