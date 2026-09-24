import { api } from '@/shared/api/apiClient'

import type { LoginProvider, Me } from '../types/user'

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
