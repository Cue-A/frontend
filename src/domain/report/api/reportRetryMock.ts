import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { ANALYSIS_STAGES } from '../types/analysis'
import type { ReportErrorPush } from '../types/analysis'
import type { RetryAxis } from '../types/report'

import { buildMockReport, MOCK_REPORT_IDS, recoverMockAxes } from './reportMock'
import type { ReportSocketHandlers } from './reportRequestMock'

/**
 * 부분 재시도 등록과 그 진행 소켓 목업입니다.
 *
 * 백엔드에 재시도 API 가 없어서 `missingInBackend` 를 답니다. `VITE_REAL_APIS=reports` 로 켜도 이 API 는
 * 목업이 받고, 소켓도 목업으로 붙습니다(`reportSocket.ts` `connectRetrySocket`).
 *
 * | 리포트 | 다시 분석하면 |
 * |---|---|
 * | 3회차(`latest`) · 그 밖 | 다섯 단계를 0.8초씩 넘기고 살아납니다. 총점 · 상태가 바뀝니다 |
 * | `bothFailed` 말하기 | 첫 번째는 끝까지 돌지만 **또 실패**(리포트는 그대로 `PARTIAL`), 두 번째에 살아납니다 |
 * | `bothFailed` 시선 | 첫 번째는 소켓 `error`(`AI_TIMEOUT`, 다시 요청 가능), 두 번째에 살아납니다 |
 *
 * 몇 번째인지는 메모리에만 셉니다. 새로고침하면 처음부터입니다.
 */

const STAGE_MS = 800

const RETRY_AXES: RetryAxis[] = ['speech', 'gaze']

/** 등록한 재시도. 소켓이 붙으면 꺼내 씁니다 */
const pendingRuns = new Map<string, { axes: RetryAxis[] }>()

/** `${reportId}:${axis}` 별로 몇 번째 재시도인지 */
const attempts = new Map<string, number>()

function isRetryAxes(value: unknown): value is RetryAxis[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((axis) => RETRY_AXES.includes(axis as RetryAxis))
  )
}

registerMock(
  'POST',
  '/api/reports/:reportId/retry',
  ({ reportId }, body) => {
    const axes = (body as { axes?: unknown } | undefined)?.axes
    if (!isRetryAxes(axes)) {
      throw new ApiError('INVALID_REQUEST', '다시 분석할 축이 없습니다')
    }
    // AI 계약 14장 — PARTIAL 리포트만 재시도할 수 있습니다.
    if (buildMockReport(reportId).status !== 'partial') {
      throw new ApiError('INVALID_REQUEST', '일부 항목이 빠진 리포트만 다시 분석할 수 있습니다')
    }

    axes.forEach((axis) => {
      const key = `${reportId}:${axis}`
      attempts.set(key, (attempts.get(key) ?? 0) + 1)
    })
    pendingRuns.set(reportId, { axes })

    return { reportId, status: 'PROCESSING' }
  },
  { missingInBackend: '부분 재시도 API 없음 (backend docs/13-report.md "아직 없는 것")' },
)

type MockOutcome =
  | { kind: 'recovered' }
  | { kind: 'stillFailed' }
  | { kind: 'error'; error: ReportErrorPush }

function toOutcome(reportId: string, axes: RetryAxis[]): MockOutcome {
  if (reportId !== MOCK_REPORT_IDS.bothFailed) return { kind: 'recovered' }

  const isFirst = (axis: RetryAxis) => axes.includes(axis) && attempts.get(`${reportId}:${axis}`) === 1

  if (isFirst('gaze')) {
    return {
      kind: 'error',
      error: { errorCode: 'AI_TIMEOUT', message: '리포트 재시도 시간이 초과되었습니다', retryable: true },
    }
  }
  if (isFirst('speech')) return { kind: 'stillFailed' }

  return { kind: 'recovered' }
}

/** 실제 소켓과 같은 순서로 메시지를 흘립니다. 반환값은 정리 함수입니다 */
export function connectMockRetrySocket(reportId: string, handlers: ReportSocketHandlers): () => void {
  const run = pendingRuns.get(reportId)
  const timers: ReturnType<typeof setTimeout>[] = []

  ANALYSIS_STAGES.forEach((stage, index) => {
    timers.push(
      setTimeout(
        () => handlers.onProgress({ stage: stage.key, progress: (index + 1) / ANALYSIS_STAGES.length }),
        STAGE_MS * index,
      ),
    )
  })

  timers.push(
    setTimeout(() => {
      pendingRuns.delete(reportId)

      // 등록 없이 소켓만 붙은 경우입니다. 실제 서버라면 아무것도 오지 않겠지만, 목업은 끝을 알려줍니다.
      if (!run) {
        handlers.onError({ errorCode: 'INTERNAL_ERROR', message: '등록된 재시도가 없습니다', retryable: true })
        return
      }

      const outcome = toOutcome(reportId, run.axes)
      if (outcome.kind === 'error') {
        handlers.onError(outcome.error)
        return
      }
      if (outcome.kind === 'recovered') recoverMockAxes(reportId, run.axes)

      const report = buildMockReport(reportId)
      handlers.onReport({
        reportId,
        status: report.status === 'partial' ? 'PARTIAL' : 'COMPLETED',
        scoreTotal: report.totalScore,
      })
    }, STAGE_MS * ANALYSIS_STAGES.length),
  )

  return () => timers.forEach(clearTimeout)
}
