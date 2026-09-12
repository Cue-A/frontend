/**
 * 리포트 화면(C-01)이 쓰는 타입입니다.
 *
 * 서버 응답 타입이 아니라 **화면용 타입**입니다. 백엔드 계약이 확정되면
 * `domain/report/api/` 에서 응답을 이 모양으로 변환합니다.
 * 그래야 서버 필드가 바뀌어도 화면이 통째로 흔들리지 않습니다.
 * (docs/01-conventions.md "타입" 절)
 */

/** 세부 점수 항목. 디자인의 "세부 점수" 네 줄입니다. */
export type ScoreMetric = {
  key: string
  label: string
  /** 0~100. 분석에 실패했으면 null 이고 막대 대신 사유를 보여줍니다 */
  score: number | null
  /** score 가 null 일 때만 씁니다. 예) '분석 실패' */
  unavailableLabel: string | null
}

/** 회복력, 답변 마무리처럼 100점 척도가 아닌 보조 지표입니다. */
export type SubMetric = {
  key: string
  label: string
  /** '75%', '4 / 5' 처럼 단위가 제각각이라 문자열로 받습니다 */
  value: string
  description: string
}

/** 질문 하나가 어땠는지. 디자인의 "면접 흐름" 한 줄입니다. */
export type TurnFlow = {
  turnId: number
  /** 'Q1 자기소개' 처럼 번호까지 포함한 제목 */
  title: string
  comment: string
  /** '안정' · '보통' · '흔들림' */
  status: string
  /** 영상 기준 시작 초. XAI 타임라인의 마커 위치로도 씁니다 */
  startSeconds: number
  /** 영상 기준 종료 초. 구간 재생에 씁니다. 아직 없으면 null (PR #8 리뷰) */
  endSeconds: number | null
  /** 0~100. 아직 못 매겼으면 null */
  score: number | null
}

/**
 * 잘한 점 · 아쉬운 점 한 줄입니다.
 *
 * 지금 화면은 글만 보여주지만, 영상 구간으로 이동하는 기능이 붙을 예정이라
 * 시각을 담을 자리를 열어둡니다. 없으면 null 입니다. (PR #8 리뷰)
 */
export type Highlight = {
  text: string
  startSeconds: number | null
  endSeconds: number | null
}

/** 총 소요, 평균 답변처럼 면접 자체의 개요입니다. */
export type OverviewFact = {
  key: string
  label: string
  value: string
}

/** 회차 선택 칩 하나. */
export type AttemptRef = {
  attempt: number
  reportId: string
  isLatest: boolean
}

/** 지난 회차 대비 총점 변화. 첫 회차면 리포트에서 null 입니다. */
export type ScoreDelta = {
  fromAttempt: number
  /** 오른 점수. 떨어졌으면 음수 */
  diff: number
}

/** 개선 답변 예시. 한 질문에 대해서만 옵니다. */
export type ImprovedAnswer = {
  turnTitle: string
  myAnswer: string
  example: string
}

export type ReportSummary = {
  /** 한 줄 총평 */
  verdict: string
  overview: OverviewFact[]
  turns: TurnFlow[]
  strengths: Highlight[]
  weaknesses: Highlight[]
}

/**
 * 분석 진행 상태입니다.
 *
 * 리포트 주소로 바로 들어오거나 새로고침하면 아직 분석이 안 끝났을 수 있습니다.
 * 그때 빈 리포트를 그리면 "점수가 0점"처럼 보여서 상태를 따로 받습니다.
 * 진행 중 화면 자체는 분석 중 페이지가 담당합니다. (PR #8 리뷰)
 */
export type AnalysisStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type Report = {
  reportId: string
  /** 면접 세션과 1:1 입니다. 면접이 끝나면 sessionId 로 리포트를 찾아옵니다 */
  sessionId: string
  analysisStatus: AnalysisStatus
  companyName: string | null
  jobRole: string
  /** 'YYYY.MM.DD' 로 이미 다듬어서 넘깁니다 */
  interviewDate: string
  questionCount: number

  attempt: number
  /** 회차 선택 칩에 쓸 목록 */
  attempts: AttemptRef[]

  /** 0~100 */
  totalScore: number
  totalScoreDelta: ScoreDelta | null

  /** 시선 분석 실패처럼 화면 위에 띄울 안내. 없으면 빈 배열 */
  notices: string[]

  summary: ReportSummary
  metrics: ScoreMetric[]
  subMetrics: SubMetric[]
  /** 세부 점수 소제목. 예) '2회차 대비 내용 구성이 가장 크게 좋아졌어요' */
  metricsComment: string | null

  improvedAnswer: ImprovedAnswer | null
}
