import { api } from '@/shared/api/apiClient'

import './reportRequestMock'

/** 리포트 분석 작업을 등록한 직후의 응답입니다. (Cue-A/backend#50 `ReportRequestResponse`) */
export type ReportRequestResponse = {
  /** UUID. 소켓 경로와 리포트 조회에 씁니다 */
  reportId: string
  sessionId: string
  /** 등록 직후에는 항상 `PROCESSING` 입니다 */
  status: 'PROCESSING'
  createdAt: string
}

/**
 * 등록 경로입니다. 소켓을 실제로 붙일지도 이 경로로 정합니다. (reportSocket.ts)
 *
 * 리포트 등록은 면접 세션의 하위 자원이라 **`interviews` 도메인**입니다. 소켓(`/ws/reports/...`)은 `reports`
 * 도메인이라 `VITE_REAL_APIS` 로 따로 켜면 등록은 실제 서버에, 소켓은 목업에 붙는 반쪽 상태가 됩니다.
 */
export const reportRequestPath = (sessionId: string) =>
  `/api/interviews/${encodeURIComponent(sessionId)}/reports`

/**
 * 끝난 면접의 리포트 분석을 맡깁니다. 결과는 기다리지 않고 바로 202 로 옵니다.
 * 진행 상황과 결과는 `connectReportSocket(reportId)` 로 받습니다. (Cue-A/backend#50)
 *
 * 실패
 * - 409 `SESSION_NOT_COMPLETED` · `SESSION_ABORTED` — 끝나지 않았거나 중단된 면접
 * - 409 `REPORT_ALREADY_EXISTS` — 이미 요청한 면접. 실패(`FAILED`)한 리포트만 다시 요청할 수 있고, 그때는
 *   reportId 가 그대로입니다
 * - 422 `REPORT_TOO_SHORT` — 되묻기를 뺀 답변이 2문항 미만
 * - 503 `AI_UNAVAILABLE` · 504 `AI_TIMEOUT` — 다시 요청하면 풀릴 수 있습니다
 * - 분당 10회 제한 (`RATE_LIMIT_EXCEEDED`)
 */
export function requestReport(sessionId: string) {
  return api.post<ReportRequestResponse>(reportRequestPath(sessionId))
}
