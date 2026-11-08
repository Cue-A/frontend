/**
 * 라우트 경로를 한 곳에서 관리합니다.
 * 화면에서 문자열을 직접 쓰지 말고 여기의 상수·헬퍼를 쓰세요.
 * 경로가 바뀌어도 이 파일만 고치면 됩니다.
 */
export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  /** AUTH-2. 카카오가 인가 코드를 돌려보내는 콜백입니다. 화면 없는 라우트입니다. */
  KAKAO_CALLBACK: '/auth/kakao/callback',
  /** A-04 홈 대시보드. 로그인 · 회원가입 뒤에 오는 곳이자 사이드바 "홈" 입니다 */
  HOME: '/home',
  SESSION_SETUP: '/interviews/new',
  DEVICE_CHECK: '/interviews/:sessionId/device-check',
  /** 재연습 설정. `sessionId` 는 다시 볼 면접(몇 회차든)입니다 (이슈 #152) */
  REPLAY: '/interviews/:sessionId/replay',
  INTERVIEW: '/interviews/:sessionId',
  ANALYZING: '/interviews/:sessionId/analyzing',
  REPORT: '/reports/:reportId',
  /** C-02 내 보관함 > 자소서 · 포트폴리오 (이슈 #59) */
  LIBRARY_DOCUMENTS: '/library/documents',
  /** 내 보관함 > 연습 기록. 지난 모의면접을 폴더 · 상태로 거르고 리포트를 다시 봅니다 */
  LIBRARY_PRACTICE: '/library/practice',
  /** 내 보관함 > 질문 은행. 공통 질문과 면접에서 쌓인 질문을 보고, 다시 볼 질문은 북마크합니다 (이슈 #138) */
  LIBRARY_QUESTIONS: '/library/questions',
  /** C-04 성장 관리 — 회차별 점수 추이 · 이번 주 목표 · 배지 · 면접 캘린더 (이슈 #136) */
  GROWTH: '/growth',
  /** 기업 탐색 — 검증된 기업 목록과 관심 등록 (이슈 #162) */
  COMPANIES: '/companies',
  /** 기업 상세 — 업종 · 핵심 가치 · 행동지표, 이 기업으로 면접 연습하기 */
  COMPANY: '/companies/:companyId',
  /**
   * 마이페이지의 앞부분. 사이드바가 "마이페이지" 칸을 켤지 정할 때 씁니다.
   * 메뉴 목록 화면은 지웠고(이슈 #185), 이 주소로 들어오면 프로필로 보냅니다.
   */
  MYPAGE: '/mypage',
  /** 마이페이지 > 프로필 — 이름 · 직무 수정, 계정(로그인 방식 · 로그아웃 · 탈퇴), 알림 설정 (이슈 #185 에서 합침) */
  MYPAGE_PROFILE: '/mypage/profile',
  /** 마이페이지 > 관심 기업 */
  MYPAGE_INTERESTS: '/mypage/interests',
  /** 옛 알림 설정 주소. 프로필에 합쳐서 프로필의 알림 칸으로 보냅니다 (이슈 #185) */
  MYPAGE_NOTIFICATIONS: '/mypage/notifications',
  /** 옛 계정 설정 주소. 프로필에 합쳐서 프로필의 계정 칸으로 보냅니다 (이슈 #185) */
  MYPAGE_ACCOUNT: '/mypage/account',
  /** 프로필 > 계정 탈퇴하기 — 이유 고르기 · 최종 확인 */
  MYPAGE_WITHDRAW: '/mypage/account/withdraw',
  /** B-01 확인용 정적 프리뷰. 리뷰 끝나면 지워도 되는 임시 라우트입니다. */
  DEV_INTERVIEW_PREVIEW: '/dev/interview-preview',
} as const

/**
 * 내 보관함 아래 화면들의 공통 앞부분. 사이드바가 "내 보관함" 칸을 켤지 정할 때 씁니다.
 * 자소서 · 포트폴리오 · 연습 기록 · 질문 은행이 이 아래에 있습니다.
 */
export const LIBRARY_PREFIX = '/library'

/** 프로필 화면 안의 칸. `/mypage/profile#account` 로 들어오면 그 칸으로 내려갑니다 (이슈 #185) */
export const MYPAGE_ACCOUNT_ID = 'account'
export const MYPAGE_NOTIFICATIONS_ID = 'notifications'

/** 프로필로 가는 주소입니다. 칸을 주면 그 칸으로 내려갑니다 — 계정(로그아웃 · 탈퇴) · 알림 설정 */
export function toMyPageProfile(section?: typeof MYPAGE_ACCOUNT_ID | typeof MYPAGE_NOTIFICATIONS_ID) {
  return section ? `${ROUTES.MYPAGE_PROFILE}#${section}` : ROUTES.MYPAGE_PROFILE
}

/** 성장 관리 주소에 붙여 이번 주 목표 창을 바로 엽니다. `/growth?open=goal` (이슈 #142) */
export const GROWTH_OPEN_PARAM = 'open'
export const GROWTH_OPEN_GOAL = 'goal'
/** 성장 관리의 면접 캘린더 자리. `/growth#calendar` 로 들어오면 그 자리로 내려갑니다 (이슈 #142) */
export const GROWTH_CALENDAR_ID = 'calendar'

/**
 * 성장 관리로 가는 주소입니다. 홈에서 들어올 때 어디를 보여줄지 고릅니다. (이슈 #142)
 * - `goal` — 이번 주 목표 창을 열어서 (홈 "목표 수정 · 목표 정하기")
 * - `calendar` — 면접 캘린더로 내려가서 (홈 "다가오는 면접일 · 전체보기")
 */
export function toGrowth(focus?: 'goal' | 'calendar') {
  if (focus === 'goal') return `${ROUTES.GROWTH}?${GROWTH_OPEN_PARAM}=${GROWTH_OPEN_GOAL}`
  if (focus === 'calendar') return `${ROUTES.GROWTH}#${GROWTH_CALENDAR_ID}`
  return ROUTES.GROWTH
}

/** 옵션 설정 주소에 붙여 기업을 미리 골라 둡니다. `/interviews/new?companyId=6` (기업 상세의 "이 기업으로 면접 연습하기") */
export const SESSION_SETUP_COMPANY_PARAM = 'companyId'

/** 면접 옵션 설정으로 갑니다. 기업 id 를 주면 기업 맞춤 질문을 켜고 그 기업을 골라 둡니다 */
export function toSessionSetup(companyId?: string) {
  if (!companyId) return ROUTES.SESSION_SETUP
  return `${ROUTES.SESSION_SETUP}?${SESSION_SETUP_COMPANY_PARAM}=${encodeURIComponent(companyId)}`
}

/**
 * 기업 상세 주소에 붙여 어디서 들어왔는지 알려줍니다. `/companies/6?from=interests`
 * 상세의 돌아가기 링크가 이 값을 보고 관심 기업 · 기업 탐색 중 돌아갈 곳을 고릅니다 (이슈 #186).
 * 새로고침하거나 주소를 복사해 열어도 남도록 `location.state` 가 아니라 주소에 싣습니다.
 */
export const COMPANY_FROM_PARAM = 'from'

/** 기업 상세로 들어오는 곳 중 돌아갈 곳이 기업 탐색이 아닌 곳. 없으면 기업 탐색으로 돌아갑니다 */
export type CompanyFrom = 'interests'

export function toCompany(companyId: string, from?: CompanyFrom) {
  const path = `/companies/${encodeURIComponent(companyId)}`
  return from ? `${path}?${COMPANY_FROM_PARAM}=${from}` : path
}

export function toDeviceCheck(sessionId: string) {
  return `/interviews/${sessionId}/device-check`
}

export function toReplay(sessionId: string) {
  return `/interviews/${sessionId}/replay`
}

export function toInterview(sessionId: string) {
  return `/interviews/${sessionId}`
}

export function toAnalyzing(sessionId: string) {
  return `/interviews/${sessionId}/analyzing`
}

/**
 * 리포트 화면의 탭. `/reports/{id}?view=growth` 면 "성장 추이 보기" 탭으로 엽니다. 없으면 "이번 회차 리포트" 입니다.
 * 주소에 두어서 새로고침 · 뒤로 가기에도 고른 탭이 남습니다 (이슈 #183).
 */
export const REPORT_VIEW_PARAM = 'view'
export const REPORT_VIEW_GROWTH = 'growth'

/** 리포트로 갑니다. `view` 를 주면 그 탭으로 엽니다 — 성장 추이 탭에서 회차를 바꿀 때 탭을 그대로 둡니다 */
export function toReport(reportId: string, view?: typeof REPORT_VIEW_GROWTH) {
  const path = `/reports/${reportId}`
  return view ? `${path}?${REPORT_VIEW_PARAM}=${view}` : path
}
