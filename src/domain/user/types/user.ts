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
 * 내 프로필. `GET /api/users/me/profile` (Cue-A/backend#128)
 *
 * 프로필을 한 번도 저장하지 않았으면 `profileImageUrl` 아래 칸은 전부 null 입니다.
 * `userName` 은 화면 머리의 `Me.nickname` 과 같은 값입니다 — 백엔드가 users 의 nickname 을 그대로 줍니다.
 * 글 칸이 빈 문자열(`''`)로 와도 `toProfile` 이 null 로 바꿉니다 — 지울 때 `''` 를 보내기 때문입니다.
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
 * 프로필 수정 입력. `PATCH /api/users/me/profile` (Cue-A/backend#128)
 *
 * **바꾼 칸만 싣습니다.** 서버는 보낸 칸만 고치고 나머지는 둡니다. 아무것도 없으면 400 `INVALID_REQUEST` 입니다.
 *
 * 서버는 `null` 을 "보내지 않음" 으로 봐서 **`null` 로는 칸을 지울 수 없습니다.** 글 칸(직무 · 자기소개 · 학교 · 전공)은
 * 빈 문자열(`''`)을 보내 지웁니다(이슈 #201 — 프론트가 지우기로 정함). 조회에서 온 `''` 는 `toProfile` 이 null 로 바꿔 둡니다.
 * 경력 단계 · 졸업연도는 지울 방법이 없습니다(허용값 · 숫자만 받음). 프로필 사진(`profileImageUrl`)은 이 API 로 바뀌지 않습니다.
 * 이메일 · 비밀번호는 이메일 변경 · 비밀번호 변경 API 가 따로 있습니다.
 */
export type ProfileUpdateInput = {
  userName?: string
  introduction?: string
  targetJobRole?: string
  careerLevel?: CareerLevel
  schoolName?: string
  major?: string
  graduationYear?: number
}

/** 로그인 수단 하나. `GET /api/users/me/account` 의 `auths` */
export type AccountAuth = {
  provider: LoginProvider
  /** 비밀번호가 있는지. 카카오 전용이면 false 라 비밀번호를 바꿀 수 없습니다 */
  hasPassword: boolean
  /** 이 수단을 연결한 때. 서버는 시간대 없는 시각(`2026-09-01T10:00:00`)을 줍니다 */
  linkedAt: string
}

/** 계정 정보. `GET /api/users/me/account` (Cue-A/backend#126) */
export type AccountInfo = {
  email: string | null
  /** 가입한 때. 서버는 시간대 없는 시각을 줍니다 — 날짜는 앞 10자리를 그대로 씁니다(시간대로 옮기면 하루 밀릴 수 있음) */
  createdAt: string
  auths: AccountAuth[]
}

/** 알림 설정. (API 명세서에 없는 임시 경로, 목업 전용 · Q16) */
export type NotificationSettings = {
  emailAlerts: boolean
  pushAlerts: boolean
}
