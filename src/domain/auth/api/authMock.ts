import { registerMock } from '@/shared/api/mock'

import type { AuthResult } from '../types/auth'

/**
 * 백엔드 인증 API 가 준비되기 전까지 화면을 그리기 위한 가짜 응답입니다.
 * 계약이 확정되면 이 파일을 지우고 authApi 의 mock import 만 뗍니다.
 */
const FAKE_RESULT: AuthResult = { accessToken: 'mock-access-token' }

registerMock('POST', '/api/auth/login', () => FAKE_RESULT)
registerMock('POST', '/api/auth/signup', () => FAKE_RESULT)
