import { api } from '@/shared/api/apiClient'

import type { Report } from '../types/report'

import './reportMock'

/**
 * 백엔드 계약이 확정되면 여기서 응답을 Report 모양으로 변환합니다.
 * 지금은 목업이 이미 화면용 모양으로 오기 때문에 그대로 돌려줍니다.
 */
export function getReport(reportId: string) {
  return api.get<Report>(`/api/reports/${reportId}`)
}
