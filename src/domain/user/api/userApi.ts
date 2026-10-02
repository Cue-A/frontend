import { api } from '@/shared/api/apiClient'

import type { LoginProvider, Me, WithdrawRequest } from '../types/user'

import './userMock'

/** 서버 응답 모양 (Cue-A/backend `UserResponse`). 화면 타입과 같지만 변환 자리를 둡니다. */
type UserResponse = {
  userId: string
  nickname: string
  email: string | null
  providers: LoginProvider[]
}

/**
 * 로그인한 사용자. `GET /api/users/me`
 *
 * 로그인이 필요합니다. 토큰 없이 부르면 `UNAUTHORIZED` 입니다.
 * `VITE_REAL_APIS` 이름은 `users` 입니다.
 */
export async function getMe(): Promise<Me> {
  const response = await api.get<UserResponse>('/api/users/me')
  return {
    userId: response.userId,
    nickname: response.nickname,
    email: response.email,
    providers: response.providers,
  }
}

/**
 * 회원 탈퇴. `POST /api/users/me/withdrawal` — **백엔드에 아직 없습니다.** 경로와 본문은 임시로 정한 것이라
 * 목업(`missingInBackend`)이 답합니다. 백엔드에 생기면 계약을 대조하고 목업 표시를 지웁니다.
 * (docs/90-open-questions.md Q14)
 *
 * `DELETE /api/users/me` 가 아니라 POST 로 둔 이유는 탈퇴 이유를 본문에 실어야 해서입니다. DELETE 본문은
 * 서버 · 프록시에 따라 버려질 수 있습니다.
 *
 * 성공하면 서버가 이 사용자의 refresh token 을 모두 끊는다고 가정합니다. 화면은 응답을 받자마자
 * 이 브라우저의 토큰을 지웁니다 (`useWithdraw`).
 */
export function withdraw(body: WithdrawRequest) {
  return api.post<void>('/api/users/me/withdrawal', body)
}
