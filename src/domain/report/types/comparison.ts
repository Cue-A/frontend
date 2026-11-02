/**
 * 회차 비교 · 성장 추이 화면 타입입니다. (`GET /api/reports/{reportId}/comparison` — API 명세서 v0.2 「회차 비교·성장 추이 조회」)
 *
 * 서버 응답 모양은 `api/reportComparisonApi.ts` 에 따로 두고 거기서 옮겨 담습니다 (docs/01-conventions.md "타입").
 */

/** 비교하는 세 축. 리포트 상세의 축 이름과 같습니다 */
export type ComparisonAxis = 'content' | 'speech' | 'gaze'

/**
 * 비교에 들어간 회차 하나. 서버의 회차별 배열(`trend.overall` · `trend.axes.*` · `rounds`)을 회차 단위로 묶었습니다.
 * 배열의 n번째가 `comparedRounds` 의 n번째 회차라서, 변환하면서 짝을 맞춰 둡니다 — 화면이 배열 순서로 회차 번호를
 * 만들면 `[1, 3]` 처럼 빈 회차에서 "2회차" 가 잘못 나옵니다.
 */
export type ComparisonRound = {
  /** 연습 기록 목록의 회차와 같은 번호(중단된 재면접은 세지 않음). 중간이 빌 수 있습니다 */
  round: number
  /** 그 회차 리포트. 막대를 누르면 이 리포트로 갑니다. 응답에서 못 찾으면 null — 막대만 그리고 링크는 걸지 않습니다 */
  reportId: string | null
  /** 부분 리포트(`PARTIAL`)였던 회차. 이 회차의 종합 점수는 null 입니다 */
  partial: boolean
  /** 그 회차 면접 시작 시각 (ISO 8601). 응답에서 못 찾으면 null */
  startedAt: string | null
  /** 종합 점수. 부분 리포트 회차는 null — 0점이 아닙니다 */
  overall: number | null
  /** 축별 점수. 실패 · 미사용 축은 null */
  axes: Record<ComparisonAxis, number | null>
}

/** 직전 회차 대비 (`vsPrevious`) */
export type PreviousComparison = {
  /**
   * 비교 대상인 직전 회차 번호. **`latestRound - 1` 이 아니라** 비교한 회차 중 끝에서 두 번째입니다
   * (2회차 리포트가 없으면 3회차 vs 1회차).
   */
  previousRound: number
  /** 종합 점수 변화. 두 회차 중 하나가 부분 리포트면 null(비교 불가) */
  overallDelta: number | null
  /** 축별 점수 변화. 한쪽 축이 실패 · 미사용이면 null(비교 불가) */
  axisDelta: Record<ComparisonAxis, number | null>
  improvedCount: number
  declinedCount: number
  unchangedCount: number
  /** 직전 대비 코멘트. 비어 오면 null */
  comment: string | null
}

export type RoundComparison = {
  /** 기준 리포트(= 마지막 회차) */
  reportId: string
  latestRound: number
  /** 회차 오름차순. 비교한 회차가 없으면 빈 배열입니다 */
  rounds: ComparisonRound[]
  /** 비교할 이전 회차가 없으면(이 리포트 하나뿐) null — 오류가 아닙니다 */
  previous: PreviousComparison | null
  /** 전체 추이 코멘트. 비어 오면 null */
  trendComment: string | null
  /** 가장 잘한 회차 */
  bestRound: number | null
  /** 최근 3회차 동안 정체된 축 */
  stalledAxes: ComparisonAxis[]
}
