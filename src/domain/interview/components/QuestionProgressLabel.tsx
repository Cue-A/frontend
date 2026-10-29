type Props = {
  questionNumber: number | null
  questionTotal: number
}

/** "질문 N / M" — 진행률 표기는 이 형태만 쓴다 (백엔드 확정 사항, "주제 N / M" 금지). */
export default function QuestionProgressLabel({ questionNumber, questionTotal }: Props) {
  return (
    <span className="text-body text-neutral-500">
      질문 {questionNumber ?? '—'} / {questionTotal}
    </span>
  )
}
