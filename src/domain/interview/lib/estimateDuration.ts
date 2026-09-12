/**
 * 질문 하나를 읽고 넘어가는 데 걸리는 여유 시간(초)입니다.
 *
 * 답변을 제출하면 다음 질문까지 5~15초가 걸립니다. (PR #13 리뷰)
 * 중간값을 잡았습니다.
 */
const OVERHEAD_SECONDS_PER_QUESTION = 10

/**
 * 총 예상 소요 시간을 분으로 돌려줍니다.
 *
 * 답변 시간만 더하면 실제보다 짧게 나옵니다. 답을 제출하고 다음 질문이 뜨기까지의
 * 시간이 질문마다 붙어서, 그만큼을 여유로 얹습니다.
 * 시안 기준(9문항 × 90초)이면 15분이 됩니다.
 *
 * **어림값입니다.** 질문 간 대기가 5~15초로 들쭉날쭉하고 사람마다 답변 길이도
 * 달라서, 화면에서는 "약 N분"으로 보여줍니다.
 *
 * 답변 시간이 "제한 없음"이면 계산할 수 없어서 null 을 돌려줍니다.
 * 없는 숫자를 지어내는 것보다 낫습니다.
 */
export function estimateDurationMinutes(
  questionCount: number,
  answerSeconds: number | null,
): number | null {
  if (answerSeconds === null) return null

  const total = questionCount * (answerSeconds + OVERHEAD_SECONDS_PER_QUESTION)
  return Math.round(total / 60)
}
