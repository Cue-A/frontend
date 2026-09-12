/** AUTH-1 · AUTH-3 요청 모양입니다. 회원가입 · 로그인이 지금은 필드가 같습니다. */
export type LoginRequest = {
  email: string
  password: string
}

export type SignupRequest = {
  email: string
  password: string
}

/** 로그인 · 회원가입 성공 시 내려오는 값. 지금은 액세스 토큰만 씁니다 (Q5: 헤더 Bearer 확정). */
export type AuthResult = {
  accessToken: string
}
