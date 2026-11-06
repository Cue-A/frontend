type Props = {
  children: string
}

/**
 * 북마크 버튼 왼쪽에 붙는 작은 말풍선입니다. 첫 질문 안내와 북마크 확인 문구가 같이 쓴다.
 * 오른쪽 꼬리가 버튼을 가리키며, 꼬리는 부모 `gap` 안에 걸쳐 놓는다.
 */
export default function BookmarkBubble({ children }: Props) {
  return (
    <div role="status" className="relative rounded-md bg-primary-100 px-3 py-2 text-body-sm text-primary-700">
      {children}
      <span aria-hidden="true" className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-primary-100" />
    </div>
  )
}
