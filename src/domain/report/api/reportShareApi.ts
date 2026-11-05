import { api } from '@/shared/api/apiClient'

import './reportShareMock'

/** 서버 응답 모양입니다. 아직 백엔드에 없는 API 라 프론트가 먼저 정한 임시 모양입니다 (이슈 #32) */
export type ReportShareLinkResponse = {
  shareUrl: string
  /** 링크가 만료되는 시각(ISO). 만료가 없으면 null */
  expiresAt: string | null
}

/**
 * 리포트 공유 링크 발급. `POST /api/reports/{reportId}/share-link` — **백엔드에 아직 없습니다.**
 *
 * 지금은 목업(`reportShareMock.ts`)이 답합니다. `reports` 를 실제 서버에 붙여도 이 API 만은 목업입니다(`missingInBackend`).
 * 백엔드에 생기면 목업의 `missingInBackend` 를 지우고, 응답 모양이 다르면 여기서 맞춥니다.
 */
export function createReportShareLink(reportId: string) {
  return api.post<ReportShareLinkResponse>(`/api/reports/${encodeURIComponent(reportId)}/share-link`)
}
