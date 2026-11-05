/**
 * XAI 타임라인입니다. (`GET /api/reports/{reportId}/timeline`, Cue-A/backend#90 · 이슈 #168)
 *
 * 근거는 원 질문별로 묶여 옵니다. 되묻기 답변에서 나온 근거도 원 질문 아래에 있고, `questionId` 가 되묻기 id 입니다.
 * 시각은 **그 답변 녹음 기준 초**라, 한 줄 트랙에 그릴 때는 앞 문항들의 답변 길이를 더합니다.
 */

/** 분석 축. 리포트 세부 점수의 내용 · 말하기 · 시선입니다 */
export type TimelineAxis = 'content' | 'speech' | 'gaze'

/** 축 상태. `failed` 는 분석 실패, `skipped` 는 그 축을 쓰지 않은 것(예: 카메라 미사용 시선)입니다 */
export type TimelineAxisStatus = 'ok' | 'failed' | 'skipped'

export type TimelineEvidence = {
  axis: TimelineAxis
  /** 근거가 나온 답변의 질문 id. 되묻기면 되묻기 id 입니다 */
  questionId: string
  isReask: boolean
  /** 초. 없을 수 있습니다 */
  tStart: number | null
  tEnd: number | null
  kind: 'strength' | 'weakness'
  /** "침묵" 처럼 짧은 이름 */
  label: string
  comment: string | null
}

export type TimelineQuestion = {
  /** 원 질문 id */
  questionId: string
  questionNumber: number
  questionText: string | null
  /** 답변 길이(초). 모르면 null */
  durationSec: number | null
  hadReask: boolean
  /** 원 답변 → 되묻기 답변, 각각 시각 순입니다 */
  evidence: TimelineEvidence[]
}

export type ReportTimeline = {
  /** 축이 빠졌으면 그 키가 없습니다 */
  axes: Partial<Record<TimelineAxis, TimelineAxisStatus>>
  /** 문항 순서대로. 근거가 없는 문항도 들어 있습니다 */
  questions: TimelineQuestion[]
}
