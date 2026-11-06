type Props = {
  label: string
}

/**
 * 답변을 제출한 뒤 다음 질문이 올 때까지 보여주는 진행 문구입니다("답변 정리 중" 등).
 * 질문 카드의 자막 자리(`CaptionLine`)에 **자막 대신** 가운데 정렬로 들어간다. 자막과 같은 높이라 바뀔 때 카드가 출렁이지 않는다.
 */
export default function LoadingLine({ label }: Props) {
  return (
    <div role="status" className="flex min-h-6 items-center justify-center gap-2 border-t border-neutral-200 pt-3.5">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" aria-hidden="true" />
      <p className="text-body-md text-neutral-500">{label}</p>
    </div>
  )
}
