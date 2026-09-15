/**
 * 라우트 경로를 한 곳에서 관리합니다.
 * 화면에서 문자열을 직접 쓰지 말고 여기의 상수·헬퍼를 쓰세요.
 * 경로가 바뀌어도 이 파일만 고치면 됩니다.
 */
export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  SESSION_SETUP: '/interviews/new',
  DEVICE_CHECK: '/interviews/:sessionId/device-check',
  INTERVIEW: '/interviews/:sessionId',
  ANALYZING: '/interviews/:sessionId/analyzing',
  REPORT: '/reports/:reportId',
  /** B-01 확인용 정적 프리뷰. 리뷰 끝나면 지워도 되는 임시 라우트입니다. */
  DEV_INTERVIEW_PREVIEW: '/dev/interview-preview',
} as const

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
