/** AUTH-1 · AUTH-3 요청 모양입니다. 회원가입 · 로그인이 지금은 필드가 같습니다. */
export type LoginRequest = {
  email: string
  password: string
}

export type SignupRequest = {
  email: string
  password: string
}

/** 로그인 수단. 계정 연동을 지원해서 배열로 옵니다 (Cue-A/backend docs/03-auth.md). */
export type Provider = 'LOCAL' | 'KAKAO'

/** 로그인 응답에 함께 실리는 사용자 정보. 로그인 직후 `/api/users/me` 를 다시 안 부르려고 같이 옵니다. */
export type AuthUser = {
  userId: string
  nickname: string
  /** 카카오 이메일 미동의 시 null */
  email: string | null
  providers: Provider[]
}

/**
 * 로그인 · 회원가입 · 카카오 · 재발급 네 경로가 전부 이 모양을 돌려줍니다.
 * (Cue-A/backend docs/03-auth.md)
 */
export type TokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  /** access token 남은 수명(초) */
  expiresIn: number
  user: AuthUser
  /** 카카오 로그인이 신규 가입까지 처리했는지. 이메일 로그인 · 재발급엔 의미가 없어 null */
  isNewUser: boolean | null
}
