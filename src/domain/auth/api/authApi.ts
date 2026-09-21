import { api } from '@/shared/api/apiClient'

import type { AuthResult, LoginRequest, SignupRequest } from '../types/auth'

import './authMock'

export function login(body: LoginRequest) {
  return api.post<AuthResult>('/api/auth/login', body)
}

export function signup(body: SignupRequest) {
  return api.post<AuthResult>('/api/auth/signup', body)
}

/**
 * 카카오 인가 코드를 백엔드로 넘겨 로그인을 완료합니다. (AUTH-2)
 * 카카오 access token 은 프론트가 받지 않습니다 — code 만 넘기면 백엔드가
 * 카카오와 직접 토큰을 교환합니다.
 */
export function loginWithKakao(code: string) {
  return api.post<AuthResult>('/api/auth/oauth/kakao', { code })
}
