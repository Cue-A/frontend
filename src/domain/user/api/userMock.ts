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

/**
 * 회원 탈퇴 목업입니다. 백엔드에 탈퇴 API 가 아직 없어서 `users` 를 실제 서버에 붙여도 이 API 만은
 * 목업이 답합니다 (docs/90-open-questions.md Q14). 목업은 아무것도 지우지 않습니다 — 탈퇴 뒤 다시
 * 로그인하면 같은 목업 사용자로 들어옵니다.
 */
registerMock('POST', '/api/users/me/withdrawal', () => undefined, {
  missingInBackend: '회원 탈퇴 API 없음 (백엔드 요청 예정)',
})
