/**
 * 리포트 화면(C-01)이 쓰는 타입입니다.
 *
 * 서버 응답 타입이 아니라 **화면용 타입**입니다. 백엔드 계약이 확정되면
 * `domain/report/api/` 에서 응답을 이 모양으로 변환합니다.
 * 그래야 서버 필드가 바뀌어도 화면이 통째로 흔들리지 않습니다.
 * (docs/01-conventions.md "타입" 절)
 */

/**
 * 축 하나가 어떻게 끝났는지입니다.
 *
 * `failed` 와 `skipped` 를 **반드시 구분해서** 보여줘야 합니다. 카메라를 켜지
 * 않아서 시선 분석을 안 한 것(`skipped`)을 "분석 실패" 로 적으면 사용자는
 * 서비스가 고장 난 줄 압니다. (AI 전달 문서 "분석 실패와 미사용을 구분하세요")
 */
export type MetricStatus = 'ok' | 'failed' | 'skipped'

/**
 * 점수의 근거가 된 답변 구간입니다.
 *
 * 재생 위치로 점프하는 기능은 아직 없지만 값은 처음부터 옵니다.
 * 자리를 지금 열어둬야 나중에 타입부터 다시 만지지 않습니다.
 */
export type Evidence = {
  questionId: string
  /** 해당 답변 오디오 기준 초 (소수 1자리) */
  startSeconds: number
  endSeconds: number
  kind: 'strength' | 'weakness'
  /** 화면 배지용 짧은 분류명. 예) '근거 부족' */
  label: string
  comment: string
}

/**
 * 세부 점수 항목. 디자인의 "세부 점수" 줄입니다.
 *
 * 축은 **내용 · 말하기 · 시선** 셋입니다. 전에는 '답변 마무리' 까지 네 줄이었는데,
 * 마무리는 말하기의 하위 지표라 총점 계산에서 말하기에 포함됩니다. 별도 축으로
 * 두면 같은 점수가 두 번 세어지는 것처럼 보입니다. (AI 전달 문서 "점수 항목")
 */
export type ScoreMetric = {
  key: string
  label: string
  status: MetricStatus
  /**
   * 0~100. `status` 가 `'ok'` 일 때만 값이 있습니다.
   *
   * `display` 와 **둘 다 서버에서 옵니다.** 하나로 다른 하나를 계산하지 마세요.
   */
  score: number | null
  /** 1~5. 화면 표시용 등급입니다. `score` 와 함께 옵니다 */
  display: number | null
  /** `status` 가 `'ok'` 가 아닐 때 막대 대신 보여줄 문구. 예) '카메라를 사용하지 않았습니다' */
  unavailableLabel: string | null
  evidence: Evidence[]
}

/**
 * 회복력, 답변 마무리처럼 100점 척도가 아닌 보조 지표입니다.
 *
 * 회복력은 **친절형 면접에서 항상 없습니다.** 압박 구간이 없어 회복을 잴 대상이
 * 없기 때문입니다. 값이 없으면 "측정 안 됨" 으로 적지 말고 목록에서 빼세요 —
 * 없는 게 정상인 상황이라 자리만 남으면 뭔가 빠진 것처럼 보입니다.
 */
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

/**
 * 답변 영상입니다. (C-01 "답변 영상")
 *
 * `playUrl` 은 서명된 임시 주소일 가능성이 높습니다. 시안에 링크 만료 상태가
 * 따로 있고(`상태C · 영상 링크 만료`), 만료돼도 점수와 분석 내용은 그대로
 * 보여줍니다. 만료를 서버가 알려주는지 재생 실패로만 알 수 있는지는 아직
 * 계약이 없어서, 화면은 `isExpired` 하나만 보고 그립니다. 계약이 오면
 * `domain/report/api/` 변환층에서 이 모양으로 맞춥니다. (이슈 #38)
 */
export type ReportVideo = {
  /** 만료됐으면 null 입니다 */
  playUrl: string | null
  isExpired: boolean
  /** 전체 길이(초) */
  durationSeconds: number
  /** '원본 화질' 처럼 그대로 보여줄 문구. 없으면 null */
  qualityLabel: string | null
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
 * 리포트가 온전한지 여부입니다.
 *
 * - `'complete'` — 세 축이 모두 정상입니다.
 * - `'partial'` — 일부 축이 실패했거나 쓰이지 않았습니다. **리포트 자체는 정상적으로
 *   옵니다.** 총점도 남은 축으로 계산되어 오니 그대로 보여주고, "일부 항목이 빠진
 *   결과" 라는 안내만 덧붙입니다.
 *
 * 전에는 `'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'` 였습니다. 계약이 없을 때
 * 지어낸 값이었고, 실제로는 이런 상태가 오지 않습니다. 내용 분석이 실패하면 리포트가
 * 아예 만들어지지 않아서 **점수가 빈 리포트라는 것 자체가 없습니다.** 그 경우는
 * 조회가 에러로 떨어지고 `useReport` 의 error 로 들어옵니다.
 * (AI 전달 문서 "리포트가 아예 안 오는 경우가 있습니다")
 */
export type ReportStatus = 'complete' | 'partial'

export type Report = {
  reportId: string
  /** 면접 세션과 1:1 입니다. 면접이 끝나면 sessionId 로 리포트를 찾아옵니다 */
  sessionId: string
  status: ReportStatus
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
  /** 1~5. 총점의 표시용 등급입니다. `totalScore` 와 함께 옵니다 */
  totalScoreDisplay: number
  totalScoreDelta: ScoreDelta | null

  /**
   * 총점에 상한이 걸린 이유입니다. 안 걸렸으면 null 입니다.
   *
   * 질문과 관계없는 답변은 말하기 · 시선 점수가 좋아도 총점이 제한됩니다.
   * 이유를 안 적으면 사용자는 점수가 왜 낮은지 알 방법이 없습니다.
   * 화면에 그대로 보여줄 문구입니다. (AI 전달 문서 "총점 상한이 걸린 경우")
   */
  scoreGateReason: string | null

  /** 시선 분석 실패처럼 화면 위에 띄울 안내. 없으면 빈 배열 */
  notices: string[]

  summary: ReportSummary
  metrics: ScoreMetric[]
  subMetrics: SubMetric[]
  /** 세부 점수 소제목. 예) '2회차 대비 내용 구성이 가장 크게 좋아졌어요' */
  metricsComment: string | null

  improvedAnswer: ImprovedAnswer | null
  /** 영상이 아예 없는 회차도 있을 수 있어서 null 을 허용합니다 */
  video: ReportVideo | null
}
