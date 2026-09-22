/**
 * 분석 중 화면(B-02)이 쓰는 타입입니다.
 *
 * 서버 응답 타입이 아니라 **화면용 타입**입니다. 단계 값과 순서는 AI 리포트
 * 계약의 `ReportStage` 를 그대로 옮겼습니다. 이 값이 어느 통로로 오는지
 * (WebSocket push 인지 폴링인지)는 아직 정해지지 않았습니다.
 * (docs/90-open-questions.md Q6b)
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
 * 서버가 보내는 단계 값(소문자 스네이크)을 화면 단계로 옮깁니다.
 *
 * 모르는 값이 오면 null 입니다. 그때는 단계를 옮기지 않습니다 — 없는 진행률을
 * 지어내는 것보다 멈춰 있는 편이 낫습니다.
 *
 * ⚠️ **아직 아무 데서도 안 부릅니다.** 값과 순서는 맞췄지만 값을 받는 통로가
 * 없어서입니다 — `useAnalysisProgress` 는 여전히 목업 타이머로만 단계를
 * 넘깁니다. 통로(폴링인지 WebSocket push 인지)가 Q6b 로 미정이라 여기서
 * 훅까지 잇지 않았습니다.
 *
 * 이을 때 확인할 것이 하나 더 있습니다. AI 계약 3장이 **"이 값을 프론트에
 * 그대로 노출하지 않고 백엔드가 자체 enum 으로 매핑한다"** 고 적고 있습니다.
 * 면접 쪽이 이미 그렇게 돕니다(`stt` → `TRANSCRIBING`). 이 함수는 AI 의 소문자
 * 스네이크를 받는 전제라, 백엔드가 다른 이름으로 내보내면 전부 null 로 떨어져
 * 단계가 안 움직입니다. 백엔드 리포트 구현이 올라오면 값 목록부터 받아야
 * 합니다. (PR #50 리뷰, docs/90-open-questions.md Q6b)
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
export const WAITING_TIPS = [
  '답변은 결론부터 정리해보세요',
  '경험은 숫자와 함께 말하면 더 잘 전달돼요',
  '말이 빨라진다 싶으면 한 박자 쉬어보세요',
  '질문 의도를 한 번 되짚고 답하면 흔들리지 않아요',
]
