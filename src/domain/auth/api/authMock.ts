import { registerMock } from '@/shared/api/mock'

import type { TokenResponse } from '../types/auth'

/**
 * 백엔드 인증 API 가 준비되기 전까지 화면을 그리기 위한 가짜 응답입니다.
 * 계약이 확정되면 이 파일을 지우고 authApi 의 mock import 만 뗍니다.
 */
const FAKE_RESULT: TokenResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 1800,
  user: {
    userId: 'mock-user-1',
    nickname: '목업사용자',
    email: 'mock@example.com',
    providers: ['LOCAL'],
  },
  isNewUser: null,
}

registerMock('POST', '/api/auth/login', () => FAKE_RESULT)
registerMock('POST', '/api/auth/signup', () => FAKE_RESULT)
registerMock('POST', '/api/auth/oauth/kakao', () => FAKE_RESULT)
// 재발급도 같은 모양을 돌려줍니다. 목업에서는 항상 성공이라 재발급 자체를
// 눈으로 보긴 어렵지만, isRealApi(auth) 로 실 서버에 붙이기 전까지 빈 핸들러로
// MOCK_NOT_FOUND 가 나지 않게 자리를 잡아둡니다.
registerMock('POST', '/api/auth/refresh', () => FAKE_RESULT)
