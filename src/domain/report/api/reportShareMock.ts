import { registerMock } from '@/shared/api/mock'

import type { ReportShareLinkResponse } from './reportShareApi'

/**
 * 리포트 공유 링크 목업입니다. (이슈 #32)
 *
 * 백엔드에 공유 링크 API 도, 링크를 받은 사람이 볼 공개 화면도 아직 없습니다. 그래서 링크는 **지금 리포트 주소 그대로**입니다 —
 * 내 계정으로 로그인한 브라우저에서만 열리고, 다른 사람이 열면 "리포트를 찾을 수 없어요" 가 나옵니다. 화면도 그렇게 안내합니다.
 *
 * 배포 서버의 리포트 id 로도 답해야 해서 목업 리포트 id 인지 보지 않습니다.
 */
registerMock(
  'POST',
  '/api/reports/:reportId/share-link',
  ({ reportId }): ReportShareLinkResponse => ({
    shareUrl: `${window.location.origin}/reports/${encodeURIComponent(reportId)}`,
    expiresAt: null,
  }),
  { missingInBackend: '리포트 공유 링크 API 없음 (공개 리포트 화면도 없음, 이슈 #32)' },
)
