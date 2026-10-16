import { api } from '@/shared/api/apiClient'

import { toReport } from './reportResponse'
import type { ReportDetailResponse } from './reportResponse'

import './reportMock'

/**
 * 리포트를 가져옵니다. (Cue-A/backend#66 `GET /api/reports/{reportId}` · 1분에 60번)
 *
 * 응답은 AI 결과를 camelCase 로 옮긴 모양이라, `reportResponse.ts` 의 `toReport` 로 화면용 리포트로 바꿉니다.
 * 응답에 없는 값(회사명 · 회차 · 영상 …)을 무엇으로 채우는지도 그 파일 맨 위 표에 있습니다.
 *
 * 끝난 리포트(COMPLETED · PARTIAL)만 내려옵니다. 나머지는 에러로 떨어지고 `useReport` 의 error 가 받습니다.
 *
 *   REPORT_NOT_FOUND   없는 리포트 · 남의 리포트 (404)
 *   REPORT_NOT_READY   아직 만드는 중 (202)
 *   REPORT_FAILED      분석이 실패한 리포트 (409)
 *
 * 분석 중 화면(B-02)이 소켓으로 끝난 걸 확인한 뒤 여기로 넘어오므로, 보통은 위 셋에 걸리지 않습니다.
 */
export async function getReport(reportId: string) {
  const detail = await api.get<ReportDetailResponse>(`/api/reports/${reportId}`)
  return toReport(detail)
}
