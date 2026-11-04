/**
 * 종합 점수를 4구간으로 나눠 숫자 색을 고릅니다. (결과 리포트 수정 시안 · 이슈 #171)
 *
 * - 0~25 빨강 · 26~50 주황 · 51~75 파랑 · 76~100 초록
 * - 경계값은 아래 구간에 넣습니다(25 는 빨강, 50 은 주황, 75 는 파랑). 시안의 구간 표기 `0-25 · 26-50 · 51-75 · 76-100` 그대로입니다
 *
 * 시안의 밝은 색(semantic-*)은 흰 배경에서 대비가 약 2:1 이라 큰 숫자도 흐려 보입니다. 같은 계열에서 더 진한 **배지 글자색**
 * 토큰을 씁니다. 색만으로 뜻을 전하지는 않습니다 — 숫자가 그대로 보이고, 색은 한눈에 가늠하게 돕는 정도입니다.
 *
 * 종합 점수에만 씁니다. 세부 점수 막대 · 회차 비교 · 성장 관리 차트는 지금 색 그대로입니다.
 */
const SCORE_BANDS: { max: number; className: string }[] = [
  { max: 25, className: 'text-badge-danger-text' },
  { max: 50, className: 'text-badge-warning-text' },
  { max: 75, className: 'text-badge-info-text' },
  { max: 100, className: 'text-badge-success-text' },
]

export function totalScoreToneClass(score: number): string {
  return SCORE_BANDS.find((band) => score <= band.max)?.className ?? SCORE_BANDS[SCORE_BANDS.length - 1].className
}
