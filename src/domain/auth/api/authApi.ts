import { api } from '@/shared/api/apiClient'

import type { LoginRequest, SignupRequest, TokenResponse } from '../types/auth'

import './authMock'

export function login(body: LoginRequest) {
  return api.post<TokenResponse>('/api/auth/login', body)
}

export function signup(body: SignupRequest) {
  return api.post<TokenResponse>('/api/auth/signup', body)
}

/**
 * 카카오 인가 코드를 백엔드로 넘겨 로그인을 완료합니다. (AUTH-2)
 * 카카오 access token 은 프론트가 받지 않습니다 — code 만 넘기면 백엔드가
 * 카카오와 직접 토큰을 교환합니다.
 *
 * `redirectUri` 는 인가 코드를 받을 때 쓴 것과 같은 값이어야 합니다 — 카카오 토큰 교환 API 자체가
 * 이 값의 일치를 요구합니다. `buildKakaoAuthorizeUrl` 과 같은 env 값을 그대로 씁니다.
 * (Cue-A/backend `KakaoLoginRequest`, PR #60 리뷰)
 */
export function loginWithKakao(code: string) {
  return api.post<TokenResponse>('/api/auth/oauth/kakao', {
    authorizationCode: code,
    redirectUri: import.meta.env.VITE_KAKAO_REDIRECT_URI,
  })
}

/**
 * 이 기기의 로그인을 끊습니다. (AUTH-5)
 * refresh token 하나만 끊습니다 — access token 은 무상태라 남은 수명(30분)까지는
 * 유효하지만, 로그아웃 직후 프론트가 토큰을 지우므로 다음 요청부터는 안 실립니다.
 * (Cue-A/backend docs/03-auth.md)
 */
export function logout(refreshToken: string) {
  return api.post<void>('/api/auth/logout', { refreshToken })
}
