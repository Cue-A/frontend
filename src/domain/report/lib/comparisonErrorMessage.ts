/**
 * 회차 비교를 불러오지 못했을 때 보여줄 문구입니다. (API 명세서 v0.2 「회차 비교·성장 추이 조회」 상태별 화면)
 *
 * 공통 문구(`shared/api/errorMessage.ts`)를 그대로 쓰지 않습니다. 같은 `AI_UNAVAILABLE` · `AI_TIMEOUT` 이 거기서는
 * 면접 진행 기준("AI 면접관에 연결하지 못했어요" · "질문을 만드는 데…")이라, 비교 화면에 띄우면 엉뚱한 말이 됩니다.
 */
export type ComparisonErrorView = {
  message: string
  /** "다시 시도" 를 둘지. 리포트 자체가 실패한 경우는 다시 불러도 같습니다 */
  retryable: boolean
}

export function comparisonErrorOf(code: string): ComparisonErrorView {
  switch (code) {
    case 'RATE_LIMIT_EXCEEDED':
      return { message: '잠시 후 다시 시도해 주세요.', retryable: true }
    // 202 · 409 는 비교가 아니라 기준 리포트의 상태입니다
    case 'REPORT_NOT_READY':
      return { message: '가장 최근 리포트를 아직 분석하고 있어요. 분석이 끝나면 비교해 드려요.', retryable: true }
    case 'REPORT_FAILED':
      return { message: '가장 최근 리포트를 만들지 못해 비교할 수 없어요.', retryable: false }
    case 'REPORT_NOT_FOUND':
      return { message: '비교할 리포트를 찾을 수 없어요.', retryable: false }
    default:
      // 502 UNEXPECTED_AI_RESPONSE · 503 AI_UNAVAILABLE · 504 AI_TIMEOUT · 네트워크 끊김
      return { message: '비교 결과를 불러오지 못했어요.', retryable: true }
  }
}
