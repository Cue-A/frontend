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
   * 직무. 옵션 설정처럼 직접 적은 글자입니다. 아직 `UserResponse` 에 없는 필드라 목업만 채웁니다 — 실제 서버 응답에
   * 없으면 `userApi.ts` 가 null 로 둡니다. (`PATCH /api/users/me/profile` 백엔드 시작 전 · docs/90-open-questions.md Q16)
   */
  jobTitle: string | null
}

/**
 * 프로필 수정 입력. `PATCH /api/users/me/profile` (백엔드 시작 전, 목업만 있음)
 *
 * 이메일은 싣지 않습니다. 명세서에 이메일 변경이 따로(`PATCH /api/users/me/email`) 있고, 카카오 로그인은 이메일이 없을 수
 * 있어서 프로필 화면에서는 보기만 합니다.
 */
export type ProfileUpdateInput = {
  nickname: string
  /** 비우면 null 입니다 */
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

/** 알림 설정. (API 명세서에 없는 임시 경로, 목업 전용 · Q16) */
export type NotificationSettings = {
  emailAlerts: boolean
  pushAlerts: boolean
}

/** 명함 색상. 시안의 5가지입니다 (B-03 마이페이지/디지털 명함) */
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
