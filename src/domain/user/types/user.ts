/** 로그인 수단. 계정 연동을 지원해서 한 사용자가 여럿을 가질 수 있습니다. */
export type LoginProvider = 'LOCAL' | 'KAKAO'

/**
 * 로그인한 사용자. (`GET /api/users/me`, Cue-A/backend `UserResponse`)
 *
 * 프로필 사진 필드는 없습니다. 화면에서 원을 그릴 때는 닉네임 첫 글자를 씁니다.
 */
export type Me = {
  userId: string
  nickname: string
  /** 카카오 로그인에서 이메일 제공에 동의하지 않았으면 null */
  email: string | null
  providers: LoginProvider[]
}

/**
 * 탈퇴 이유. 탈퇴 요청에 같이 보냅니다 (백엔드 계약 미정 — docs/90-open-questions.md Q14).
 * 화면 문구는 `lib/withdrawReasons.ts` 에 있습니다.
 */
export type WithdrawReason =
  | 'FOUND_JOB'
  | 'QUESTIONS_MISMATCH'
  | 'REPORT_UNHELPFUL'
  | 'DEVICE_TROUBLE'
  | 'PRIVACY'
  | 'NEW_ACCOUNT'
  | 'OTHER'

export type WithdrawRequest = {
  reason: WithdrawReason
  /** `OTHER` 일 때 직접 적은 이유. 비어 있으면 보내지 않습니다 */
  detail?: string
}
