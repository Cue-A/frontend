import { registerMock } from '@/shared/api/mock'

/**
 * 로그인한 사용자 목업입니다. 인증 목업(domain/auth/api/authMock.ts)의 사용자와 같은 값을 씁니다 —
 * 로그인 응답의 사용자와 `users/me` 가 다르게 보이면 목업끼리 어긋난 것처럼 보입니다.
 */
registerMock('GET', '/api/users/me', () => ({
  userId: 'mock-user-1',
  nickname: '목업사용자',
  email: 'mock@example.com',
  providers: ['LOCAL'],
}))
