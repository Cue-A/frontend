import { api } from '@/shared/api/apiClient'

import type { Report } from '../types/report'

import './reportMock'

/**
 * 리포트를 가져옵니다.
 *
 * 응답에서 **AI 분석 결과 부분**을 화면용으로 바꾸는 함수는
 * `analysisResponse.ts` 에 있습니다. 목업이 그 함수를 그대로 쓰고 있어서,
 * 실제 응답이 붙을 때 여기서 호출만 옮기면 됩니다.
 *
 * 리포트 전체 응답(회사명 · 회차 · 영상 · 개선 답변)은 AI 가 아니라 백엔드가
 * 만드는 부분이라 아직 계약이 없습니다. 경로도 `/api/v1/` 로 바뀔 예정입니다.
 * (이슈 #32 4번 · 5번)
 *
 * 내용 분석이 실패한 회차는 리포트가 아예 없습니다. 그때는 이 호출이
 * `CONTENT_FAILED` 로 떨어지고 `useReport` 의 error 가 받습니다. 빈 리포트를
 * 그리는 길은 만들지 않습니다.
 */
export function getReport(reportId: string) {
  return api.get<Report>(`/api/reports/${reportId}`)
}
