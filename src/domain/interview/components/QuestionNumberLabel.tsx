type Props = {
  questionNumber: number | null
}

/**
 * "Q{questionNumber}". REASK 로 questionNumber 가 null 로 오는 경우는 없고,
 * "직전 값 유지"는 상위(B-01-2 세션 상태 훅)가 해결한 뒤 이 컴포넌트에 내려준다.
 * 그래도 값이 없는 순간을 대비해 대시로만 안전하게 표시한다.
 */
export default function QuestionNumberLabel({ questionNumber }: Props) {
  return (
    // TODO(design-token): design-system.md에 없는 값. 임시로 text-body-md(14px Regular) 사용 중.
    // 필요한 값: "Qn" 라벨 Bold 14px 텍스트 스타일 (Figma 848:7, 문서 미정의)
    <span className="text-body-md text-primary-500">Q{questionNumber ?? '—'}</span>
  )
}
