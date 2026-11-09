/** 로그인 수단. 계정 연동을 지원해서 한 사용자가 여럿을 가질 수 있습니다. */
export type LoginProvider = 'LOCAL' | 'KAKAO'

/**
 * 로그인한 사용자. (`GET /api/users/me`, Cue-A/backend `UserResponse`)
 *
 * 화면 머리(오른쪽 위 프로필)와 다른 도메인이 씁니다. 프로필 화면에서 고치는 값은 프로필 조회(`Profile`)에 따로 있습니다.
 * 프로필 사진 필드는 없습니다. 화면에서 원을 그릴 때는 닉네임 첫 글자를 씁니다.
 */
export type Me = {
  userId: string
  nickname: string
  /** 카카오 로그인에서 이메일 제공에 동의하지 않았으면 null */
  email: string | null
  providers: LoginProvider[]
}

/** 경력 단계. 서버가 이 넷만 받습니다 (API 명세서 "프로필 수정") */
export type CareerLevel = 'student' | 'entry' | 'junior' | 'experienced'

/**
 * 내 프로필. `GET /api/users/me/profile` (API 명세서 "내정보 조회" — 백엔드 시작 전, 목업만 있음 · Q16)
 *
 * 프로필을 한 번도 저장하지 않았으면 `profileImageUrl` 아래 칸은 전부 null 입니다.
 * `userName` 은 화면 머리의 `Me.nickname` 과 같은 값으로 봅니다 (같은 users 테이블 값인지 백엔드 확인 중 · Q16).
 */
export type Profile = {
  userId: string
  userName: string
  /** 카카오 로그인에서 이메일 제공에 동의하지 않았으면 null */
  email: string | null
  profileImageUrl: string | null
  introduction: string | null
  /** 직무. 옵션 설정처럼 직접 적은 글자입니다(50자) */
  targetJobRole: string | null
  careerLevel: CareerLevel | null
  schoolName: string | null
  major: string | null
  graduationYear: number | null
}

/**
 * 프로필 수정 입력. `PATCH /api/users/me/profile` (API 명세서 "프로필 수정" — 백엔드 시작 전, 목업만 있음)
 *
 * **바꾼 칸만 싣습니다.** 서버는 보낸 칸만 고치고 나머지는 둡니다. 아무것도 없으면 `EMPTY_UPDATE_REQUEST`(400) 입니다.
 * 이메일 · 비밀번호는 여기서 바꾸지 않습니다 — 이메일 변경 · 비밀번호 변경 API 가 따로 있습니다(화면은 아직).
 */
export type ProfileUpdateInput = Partial<Omit<Profile, 'userId' | 'email'>>

/** 로그인 수단 하나. `GET /api/users/me/account` 의 `auths` */
export type AccountAuth = {
  provider: LoginProvider
  /** 비밀번호가 있는지. 카카오 전용이면 false 라 비밀번호를 바꿀 수 없습니다 */
  hasPassword: boolean
  /** 이 수단을 연결한 때 (ISO 문자열) */
  linkedAt: string
}

/** 계정 정보. `GET /api/users/me/account` (API 명세서 "계정 정보 조회" — 백엔드 시작 전, 목업만 있음 · Q16) */
export type AccountInfo = {
  email: string | null
  /** 가입한 때 (ISO 문자열) */
  createdAt: string
  auths: AccountAuth[]
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
