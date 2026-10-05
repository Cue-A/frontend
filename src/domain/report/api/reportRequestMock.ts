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
 *
 * 상태 조회(`GET /api/reports/:reportId/status`)는 등록한 시각부터 흐른 시간으로 같은 흐름을 계산합니다.
 * 분석 도중 새로고침하면 소켓 목업은 처음부터 다시 흘리지만, 상태 조회가 지금 단계를 먼저 알려줍니다.
 * 등록하지 않은 reportId 는 상태 조회가 404 `REPORT_NOT_FOUND` 이고 소켓은 아무것도 보내지 않습니다 (실제 서버와 같음).
 */

const STAGE_MS = 2000

type Scenario = { sessionId: string; attempt: number; startedAt: number }

/**
 * 소켓 · 상태 조회 목업이 어떤 흐름을 돌지 reportId 로 찾습니다. 등록할 때 채웁니다.
 *
 * 새로고침해도 이어지도록 sessionStorage 에 둡니다. 메모리에만 두면 새로고침하는 순간 목업이 등록을 잊어서
 * 상태 조회가 404 가 나고, 실제 서버와 다르게 등록부터 다시 돕니다.
 */
const SCENARIO_KEY = 'cue-a:mock:report-scenarios'

const scenarios = {
  get(reportId: string): Scenario | undefined {
    return readScenarios()[reportId]
  },
  set(reportId: string, scenario: Scenario) {
    try {
      sessionStorage.setItem(SCENARIO_KEY, JSON.stringify({ ...readScenarios(), [reportId]: scenario }))
    } catch {
      // 저장이 막혀도 목업이 새로고침 때 등록을 잊을 뿐입니다.
    }
  },
}

function readScenarios(): Record<string, Scenario> {
  try {
    return JSON.parse(sessionStorage.getItem(SCENARIO_KEY) ?? '{}') as Record<string, Scenario>
  } catch {
    return {}
  }
}

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
  scenarios.set(reportId, { sessionId, attempt, startedAt: Date.now() })

  return { reportId, sessionId, status: 'PROCESSING', createdAt: new Date().toISOString() }
})

registerMock('GET', '/api/reports/:reportId/status', ({ reportId }) => {
  const scenario = scenarios.get(reportId)
  if (!scenario) throw new ApiError('REPORT_NOT_FOUND', '리포트를 찾을 수 없습니다')

  const failure = toFailure(scenario)
  const stages = failure ? ANALYSIS_STAGES.slice(0, 2) : ANALYSIS_STAGES
  // 등록과 조회 사이에 시계가 뒤로 맞춰지면 음수가 됩니다. 0 으로 막지 않으면 `stages[-1]` 이 없어서 던집니다.
  const index = Math.max(0, Math.floor((Date.now() - scenario.startedAt) / STAGE_MS))
  const base = {
    reportId,
    sessionId: scenario.sessionId,
    createdAt: new Date(scenario.startedAt).toISOString(),
    stage: null,
    progress: null,
    errorCode: null,
    message: null,
    retryable: null,
    completedAt: null,
  }

  if (index < stages.length) {
    return { ...base, status: 'PROCESSING', stage: stages[index].key, progress: (index + 1) / ANALYSIS_STAGES.length }
  }

  const completedAt = new Date().toISOString()
  if (failure) {
    // 실제 서버도 소켓 `error` 와 같은 코드 · 문구 · 다시 요청 가능 여부를 줍니다 (Cue-A/backend#60)
    return { ...base, status: 'FAILED', ...failure, completedAt }
  }
  return { ...base, status: 'PARTIAL', completedAt }
})

export type ReportSocketHandlers = {
  onProgress: (progress: ReportProgressPush) => void
  onReport: (report: ReportDonePush) => void
  onError: (error: ReportErrorPush) => void
}

/** 실제 소켓과 같은 순서로 메시지를 흘립니다. 반환값은 정리 함수입니다 */
export function connectMockReportSocket(reportId: string, handlers: ReportSocketHandlers): () => void {
  const scenario = scenarios.get(reportId)
  if (!scenario) {
    // 실제 서버는 등록된 리포트에만 폴러를 돌려 메시지를 보내므로("WS 메시지는 붙어 있는 연결에만 갑니다",
    // backend docs/13-report.md) 모르는 id 에는 아무것도 오지 않습니다. 같은 id 의 상태 조회 목업은 404 입니다.
    console.warn('[목업] 등록되지 않은 리포트 소켓입니다 — 실제 서버처럼 아무것도 보내지 않습니다 reportId=%s', reportId)
    return () => {}
  }
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

function toFailure(scenario: Scenario): ReportErrorPush | null {
  if (scenario.sessionId === 'mock-report-fails-once' && scenario.attempt === 1) {
    return { errorCode: 'CONTENT_FAILED', message: '답변 내용 분석에 실패했습니다', retryable: true }
  }
  if (scenario.sessionId === 'mock-report-stt-failed') {
    return { errorCode: 'STT_FAILED', message: '음성 인식에 실패했습니다', retryable: false }
  }
  return null
}
