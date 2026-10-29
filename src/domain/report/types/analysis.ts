/**
 * 분석 중 화면(B-02)이 쓰는 타입입니다.
 *
 * 단계 값과 순서는 AI 리포트 계약의 `ReportStage` 를 옮긴 것이고, 백엔드가 같은 이름을 대문자로
 * 내보냅니다(Cue-A/backend#50 `ReportProgressStage`). 값은 WebSocket `/ws/reports/{reportId}` 로 옵니다.
 */

/**
 * 분석 단계입니다. 값과 **순서** 모두 AI 계약 기준입니다.
 *
 * 전에는 `SPEECH → CONTENT → VISION` 순이었는데 실제로는 **시선이 내용보다
 * 먼저** 돕니다. 화면 순서가 실제와 다르면 한 단계에서 오래 멈춘 것처럼 보입니다.
 *
 * 근거는 계약서의 `Literal[...]` 나열이 아니라 실행 코드입니다 —
 * `ai/report_pipeline.py` 의 `_measure` → `_build` 가 이 순서로 `set_stage` 를
 * 부릅니다. 문서가 아니라 도는 코드라 다시 따질 일이 없습니다. (PR #50 리뷰)
 */
export type AnalysisStageKey =
  | 'TRANSCRIBING'
  | 'ANALYZING_SPEECH'
  | 'ANALYZING_GAZE'
  | 'ANALYZING_CONTENT'
  | 'COMPOSING'

export type AnalysisStage = {
  key: AnalysisStageKey
  label: string
}

/** 다섯 단계입니다. 순서가 곧 진행 순서입니다. */
export const ANALYSIS_STAGES: AnalysisStage[] = [
  { key: 'TRANSCRIBING', label: 'STT 변환' },
  { key: 'ANALYZING_SPEECH', label: '말하기 습관' },
  { key: 'ANALYZING_GAZE', label: '시선 분석' },
  { key: 'ANALYZING_CONTENT', label: '내용 평가' },
  { key: 'COMPOSING', label: '종합 리포트' },
]

/**
 * 서버가 보내는 단계 값을 화면 단계로 옮깁니다.
 *
 * 백엔드는 AI 의 소문자 스네이크(`analyzing_gaze`)를 대문자 enum(`ANALYZING_GAZE`)으로 바꿔 보냅니다
 * (Cue-A/backend#50). 대소문자를 가리지 않게 받아서 어느 쪽이 와도 맞습니다.
 *
 * 모르는 값이 오면 null 입니다. 그때는 단계를 옮기지 않습니다 — 없는 진행률을
 * 지어내는 것보다 멈춰 있는 편이 낫습니다.
 */
export function toAnalysisStageKey(stage: string): AnalysisStageKey | null {
  const key = stage.toUpperCase() as AnalysisStageKey
  return ANALYSIS_STAGES.some((item) => item.key === key) ? key : null
}

/**
 * 기다리는 동안 보여줄 면접 팁입니다.
 * 화면이 몇십 초 동안 멈춰 있으면 멈춘 건지 도는 건지 헷갈리는데,
 * 문구가 바뀌면 돌아가고 있다는 게 보입니다.
 */
/**
 * 리포트 소켓 메시지입니다. (Cue-A/backend#50 `ReportProgressPushMessage` · `ReportPushMessage` · `ReportErrorPushMessage`)
 * 봉투는 면접 소켓과 같은 `{ type, payload }` 이고, type 은 `progress` · `report` · `error` 셋입니다.
 */
export type ReportProgressPush = {
  stage: string
  /** 0~1. AI 가 주지 않으면 null 입니다. 화면은 쓰지 않고 단계로만 셉니다 */
  progress: number | null
}

export type ReportDonePush = {
  reportId: string
  /** `PARTIAL` 은 말하기 · 시선 중 일부 축이 빠진 리포트입니다. 둘 다 리포트 화면으로 갑니다 */
  status: 'COMPLETED' | 'PARTIAL'
  /** 0~100 */
  scoreTotal: number | null
}

export type ReportErrorPush = {
  errorCode: string
  message: string
  /** true 면 등록 API 를 다시 불러도 됩니다. 같은 reportId 로 다시 돕니다 */
  retryable: boolean
}

export const WAITING_TIPS = [
  '답변은 결론부터 정리해보세요',
  '경험은 숫자와 함께 말하면 더 잘 전달돼요',
  '말이 빨라진다 싶으면 한 박자 쉬어보세요',
  '질문 의도를 한 번 되짚고 답하면 흔들리지 않아요',
]
