/** 질문 하나를 읽고 넘어가는 데 걸리는 여유 시간(초)입니다. */
const OVERHEAD_SECONDS_PER_QUESTION = 10

/**
 * 총 예상 소요 시간을 분으로 돌려줍니다.
 *
 * 답변 시간만 더하면 실제보다 짧게 나옵니다. 질문을 듣고 생각을 정리하는
 * 시간이 질문마다 붙어서, 그만큼을 여유로 얹습니다.
 * 시안 기준(9문항 × 90초)이면 15분이 됩니다.
 */
export function estimateDurationMinutes(questionCount: number, answerSeconds: number): number {
  const total = questionCount * (answerSeconds + OVERHEAD_SECONDS_PER_QUESTION)
  return Math.round(total / 60)
}
