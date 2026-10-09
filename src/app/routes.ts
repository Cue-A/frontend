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
  INTERVIEW: '/interviews/:sessionId',
  ANALYZING: '/interviews/:sessionId/analyzing',
  REPORT: '/reports/:reportId',
  /** C-02 내 보관함 > 자소서 · 포트폴리오 (이슈 #59) */
  LIBRARY_DOCUMENTS: '/library/documents',
  /** 마이페이지 메뉴 목록 */
  MYPAGE: '/mypage',
  /** 마이페이지 > 프로필 — 이름 · 이메일 · 직무 */
  MYPAGE_PROFILE: '/mypage/profile',
  /** 마이페이지 > 관심 기업 */
  MYPAGE_INTERESTS: '/mypage/interests',
  /** 마이페이지 > 알림 설정 */
  MYPAGE_NOTIFICATIONS: '/mypage/notifications',
  /** 마이페이지 > 나만의 명함 생성 */
  MYPAGE_BUSINESS_CARD: '/mypage/business-card',
  /** 마이페이지 > 계정 설정 — 로그아웃 · 회원 탈퇴 */
  MYPAGE_ACCOUNT: '/mypage/account',
  /** 계정 설정 > 계정 탈퇴하기 — 이유 고르기 · 최종 확인 */
  MYPAGE_WITHDRAW: '/mypage/account/withdraw',
  /** 커뮤니티 — 정보공유 · 스터디모집 탭 (B-04 시안) */
  COMMUNITY: '/community',
  /** B-01 확인용 정적 프리뷰. 리뷰 끝나면 지워도 되는 임시 라우트입니다. */
  DEV_INTERVIEW_PREVIEW: '/dev/interview-preview',
} as const

/**
 * 내 보관함 아래 화면들의 공통 앞부분. 사이드바가 "내 보관함" 칸을 켤지 정할 때 씁니다.
 * 지금은 자소서 · 포트폴리오뿐이고, 연습 기록 · 질문 은행이 생기면 같은 앞부분 아래에 둡니다.
 */
export const LIBRARY_PREFIX = '/library'

export function toDeviceCheck(sessionId: string) {
  return `/interviews/${sessionId}/device-check`
}

export function toInterview(sessionId: string) {
  return `/interviews/${sessionId}`
}

export function toAnalyzing(sessionId: string) {
  return `/interviews/${sessionId}/analyzing`
}

export function toReport(reportId: string) {
  return `/reports/${reportId}`
}
