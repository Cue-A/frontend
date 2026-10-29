import { api } from '@/shared/api/apiClient'

import type { ReportRetryInfoResponse } from './reportResponse'

import './reportRetryMock'

/**
 * 실패 축 재시도를 맡긴 직후의 응답입니다. (Cue-A/backend#68 `ReportRetryResponse`)
 *
 * 다시 분석을 시작했다는 확인일 뿐이라 점수는 없습니다. 바뀐 점수는 소켓 `report` 를 받은 뒤 상세 조회로 가져옵니다.
 */
export type ReportRetryResponse = {
  reportId: string
  /** 재시도 중에도 리포트는 `PARTIAL` 그대로입니다 */
  status: 'COMPLETED' | 'PARTIAL'
  /** 접수 직후에는 항상 `PROCESSING` 이고, `axes` 에 다시 분석하는 축이 들어 있습니다 */
  retry: ReportRetryInfoResponse | null
}

/** 재시도 경로입니다. 소켓을 실제로 붙일지도 이 경로로 정합니다. (`reportSocket.ts` `connectRetrySocket`) */
export const reportRetryPath = (reportId: string) =>
  `/api/reports/${encodeURIComponent(reportId)}/retry`

/**
 * 리포트에서 실패한 축(말하기 · 시선)을 다시 분석하게 맡깁니다. 결과는 기다리지 않고 바로 202 로 옵니다.
 * 진행과 결과는 분석 등록과 같은 소켓(`connectRetrySocket`)의 `progress` · `report` · `error` 로 옵니다.
 *
 * **요청 본문이 없습니다.** 다시 분석할 축은 백엔드가 리포트의 실패 축(`overall.axesFailed`)을 그대로 씁니다.
 * 그래서 말하기 · 시선이 둘 다 실패했으면 한 번에 둘 다 다시 분석합니다.
 *
 * - 성공하면 리포트가 새 결과로 **통째로** 바뀝니다(총점 · 상태까지, `PARTIAL` → `COMPLETED` 가능). 다시 분석했는데도
 *   그 축이 또 실패하면 리포트는 `PARTIAL` 로 남습니다
 * - 실패하면 리포트는 그대로이고, 상세 조회의 `retry.status` 가 `FAILED` 가 됩니다
 *
 * 실패
 * - 409 `REPORT_NOT_RETRYABLE` — 부분 실패(`PARTIAL`) 리포트가 아님. 이미 다른 곳에서 다시 분석해 다 살아났을 수 있습니다
 * - 409 `REPORT_RETRY_IN_PROGRESS` — 이미 다시 분석하는 중 (다른 탭 · 새로고침 전에 누른 것)
 * - 404 `REPORT_NOT_FOUND` — 없는 리포트 · 남의 리포트
 * - 분당 10회 제한
 */
export function requestAxisRetry(reportId: string) {
  return api.post<ReportRetryResponse>(reportRetryPath(reportId))
}
