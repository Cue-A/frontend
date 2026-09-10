/**
 * 리포트 화면이 쓰는 타입입니다.
 *
 * 서버 응답 타입이 아니라 **화면용 타입**입니다. 백엔드 계약이 확정되면
 * `domain/report/api/` 에서 응답을 이 모양으로 변환합니다.
 * 그래야 서버 필드가 바뀌어도 화면이 통째로 흔들리지 않습니다.
 * (docs/01-conventions.md "타입" 절)
 */

export type ScoreBreakdown = {
  /** 0~100 */
  content: number
  speech: number
  vision: number
  total: number
}

/** 답변 구간에서 눈에 띈 지점. 비어 있으면 타임라인을 그리지 않습니다. */
export type TimelineMark = {
  /** 턴 시작 기준 상대 초 */
  start: number
  end: number
  label: string
}

export type TurnReport = {
  turnId: number
  question: string
  /** 답변 전문. 아직 정리 중이면 null */
  transcript: string | null
  scores: ScoreBreakdown | null
  strength: string | null
  weakness: string | null
  /** 개선 답변 예시. 없으면 섹션을 숨깁니다 */
  improvedAnswer: string | null
  timeline: TimelineMark[]
}

export type ReportSummary = {
  overallComment: string
  strengths: string[]
  weaknesses: string[]
  /** 첫 회차면 null — "첫 연습입니다" 로 대체합니다 */
  growthNarrative: string | null
  priorityImprovement: string | null
}

export type Report = {
  reportId: string
  /** 재연습 회차. 1 이면 첫 연습 */
  attempt: number
  totalAttempts: number
  companyName: string | null
  jobRole: string
  createdAt: string
  scores: ScoreBreakdown
  summary: ReportSummary
  turns: TurnReport[]
}
