import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { ANALYSIS_STAGES } from '../types/analysis'
import type { ReportDonePush, ReportErrorPush, ReportProgressPush } from '../types/analysis'

import { MOCK_REPORT_IDS } from './reportMock'

/**
 * 리포트 분석 등록과 소켓 목업입니다. (Cue-A/backend#50)
 *
 * 목업 면접은 세션 id 가 늘 `s1` 이라, 실제 서버처럼 "이미 요청한 면접" 을 기억하면 두 번째 연습부터
 * 전부 409 로 막힙니다. 그래서 등록은 늘 받아주고, 실패 화면은 **세션 id** 로 골라 봅니다.
 * 주소창에서 `/interviews/{세션 id}/analyzing` 으로 바로 열면 됩니다.
 *
 * | 세션 id | 흐름 |
 * |---|---|
 * | 그 밖 | 다섯 단계를 2초씩 넘기고 리포트로 이동 |
 * | `mock-report-too-short` | 등록이 422 `REPORT_TOO_SHORT` |
 * | `mock-report-exists` | 등록이 409 `REPORT_ALREADY_EXISTS` |
 * | `mock-report-unavailable` | 등록이 503 `AI_UNAVAILABLE` (다시 요청 가능) |
 * | `mock-report-fails-once` | 두 단계 뒤 소켓 `error`(`CONTENT_FAILED`, 다시 요청 가능) → 다시 요청하면 끝까지 |
 * | `mock-report-stt-failed` | 두 단계 뒤 소켓 `error`(`STT_FAILED`, 다시 요청 불가) |
 */

const STAGE_MS = 2000

/** 소켓 목업이 어떤 흐름을 돌지 reportId 로 찾습니다. 등록할 때 채웁니다 */
const scenarios = new Map<string, { sessionId: string; attempt: number }>()

registerMock('POST', '/api/interviews/:sessionId/reports', ({ sessionId }) => {
  if (sessionId === 'mock-report-too-short') {
    throw new ApiError('REPORT_TOO_SHORT', '답변이 부족해 리포트를 만들 수 없습니다')
  }
  if (sessionId === 'mock-report-exists') {
    throw new ApiError('REPORT_ALREADY_EXISTS', '이미 분석을 요청한 세션입니다')
  }
  if (sessionId === 'mock-report-unavailable') {
    throw new ApiError('AI_UNAVAILABLE', 'AI 서버에 연결할 수 없습니다')
  }

  // 목업 리포트 화면이 그려지는 id 를 돌려줍니다. 실패한 리포트를 다시 요청해도 id 가 같은 것도 실제와 같습니다.
  const reportId = MOCK_REPORT_IDS.latest
  const previous = scenarios.get(reportId)
  const attempt = previous?.sessionId === sessionId ? previous.attempt + 1 : 1
  scenarios.set(reportId, { sessionId, attempt })

  return { reportId, sessionId, status: 'PROCESSING', createdAt: new Date().toISOString() }
})

export type ReportSocketHandlers = {
  onProgress: (progress: ReportProgressPush) => void
  onReport: (report: ReportDonePush) => void
  onError: (error: ReportErrorPush) => void
}

/** 실제 소켓과 같은 순서로 메시지를 흘립니다. 반환값은 정리 함수입니다 */
export function connectMockReportSocket(reportId: string, handlers: ReportSocketHandlers): () => void {
  const scenario = scenarios.get(reportId)
  const failure = toFailure(scenario)
  const timers: ReturnType<typeof setTimeout>[] = []

  const stages = failure ? ANALYSIS_STAGES.slice(0, 2) : ANALYSIS_STAGES
  stages.forEach((stage, index) => {
    timers.push(
      setTimeout(
        () => handlers.onProgress({ stage: stage.key, progress: (index + 1) / ANALYSIS_STAGES.length }),
        STAGE_MS * index,
      ),
    )
  })

  timers.push(
    setTimeout(() => {
      if (failure) handlers.onError(failure)
      else handlers.onReport({ reportId, status: 'PARTIAL', scoreTotal: 68 })
    }, STAGE_MS * stages.length),
  )

  return () => timers.forEach(clearTimeout)
}

function toFailure(scenario: { sessionId: string; attempt: number } | undefined): ReportErrorPush | null {
  if (scenario?.sessionId === 'mock-report-fails-once' && scenario.attempt === 1) {
    return { errorCode: 'CONTENT_FAILED', message: '답변 내용 분석에 실패했습니다', retryable: true }
  }
  if (scenario?.sessionId === 'mock-report-stt-failed') {
    return { errorCode: 'STT_FAILED', message: '음성 인식에 실패했습니다', retryable: false }
  }
  return null
}
