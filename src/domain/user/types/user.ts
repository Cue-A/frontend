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
  /**
   * 직무. 아직 `UserResponse` 에 없는 필드라 목업만 채웁니다 — 실제 서버 응답에 없으면
   * `userApi.ts` 가 null 로 둡니다 (API 명세서 `PATCH /users/me/profile` 시작 전).
   */
  jobTitle: string | null
}

/** 프로필 수정 입력. `PATCH /users/me/profile` (API 명세서 — 시작 전, 목업만 있음) */
export type ProfileUpdateInput = {
  nickname: string
  email: string
  jobTitle: string | null
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

/** 관심 기업 한 건. (`GET /v1/users/me/company-interests` — 목업만 있음) */
export type CompanyInterest = {
  companyId: string
  name: string
  /** 명함처럼 글자 하나로도 그릴 수 있게 색을 같이 둡니다 */
  tagline: string
}

/** 알림 설정. (명세서에 없는 임시 경로, 목업 전용) */
export type NotificationSettings = {
  emailAlerts: boolean
  pushAlerts: boolean
}

/** 명함 색상. 시안의 5가지 프리셋입니다. */
export type BusinessCardColor = 'purple' | 'blue' | 'green' | 'orange' | 'black'

export type BusinessCard = {
  companyName: string
  name: string
  jobTitle: string
  email: string
  phone: string
  color: BusinessCardColor
  updatedAt: string
}

export type BusinessCardInput = {
  companyName: string
  name: string
  jobTitle: string
  email: string
  phone: string
  color: BusinessCardColor
}
