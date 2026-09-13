/**
 * 분석 중 화면(B-02)이 쓰는 타입입니다.
 *
 * 서버 응답 타입이 아니라 **화면용 타입**입니다. 진행 상태를 어디서
 * 받아올지(WebSocket 메시지 형식)는 아직 정해지지 않았습니다.
 * (docs/90-open-questions.md Q6b)
 */

export type AnalysisStageKey =
  | 'TRANSCRIBING'
  | 'SPEECH'
  | 'CONTENT'
  | 'VISION'
  | 'REPORT'

export type AnalysisStage = {
  key: AnalysisStageKey
  label: string
}

/** 시안 B-02 의 다섯 단계입니다. 순서가 곧 진행 순서입니다. */
export const ANALYSIS_STAGES: AnalysisStage[] = [
  { key: 'TRANSCRIBING', label: 'STT 변환' },
  { key: 'SPEECH', label: '말하기 습관' },
  { key: 'CONTENT', label: '내용 평가' },
  { key: 'VISION', label: '시선 분석' },
  { key: 'REPORT', label: '종합 리포트' },
]

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
