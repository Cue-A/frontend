import { api } from '@/shared/api/apiClient'

import type { ReportShareResponse } from './reportResponse'

import './reportShareMock'

/**
 * 리포트 공유 링크 만들기. `POST /api/reports/{reportId}/share` — `reports` 도메인입니다 (Cue-A/backend#137).
 *
 * - 끝난 리포트(COMPLETED · PARTIAL)만 됩니다. 진행 중이면 202 `REPORT_NOT_READY`, 실패면 409 `REPORT_FAILED`
 * - **이미 공유 중이면 같은 링크**를 돌려줍니다. 다시 눌러도 보낸 링크가 깨지지 않습니다
 * - 유효기간은 없습니다. 해제할 때까지 열립니다
 * - 1분에 30번
 */
export function createReportShare(reportId: string) {
  return api.post<ReportShareResponse>(`/api/reports/${encodeURIComponent(reportId)}/share`)
}

/**
 * 리포트 공유 해제. `DELETE /api/reports/{reportId}/share` (Cue-A/backend#137).
 *
 * 해제하면 그 링크는 바로 막힙니다. 다시 공유하면 새 링크(새 `shareId`)가 나오고 예전 링크는 계속 막힙니다.
 * 공유하지 않은 리포트를 해제해도 오류가 아닙니다. 1분에 30번.
 */
export function deleteReportShare(reportId: string) {
  return api.delete<void>(`/api/reports/${encodeURIComponent(reportId)}/share`)
}
