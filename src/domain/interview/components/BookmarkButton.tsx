type Props = {
  bookmarked: boolean
  /** 서버에 보내는 중. 눌러도 반응하지 않는다. */
  pending?: boolean
  onClick: () => void
}

/** 질문 카드 우측 상단 북마크. 누르면 이 질문이 질문은행 "북마크" 에 담기고, 다시 누르면 빠진다. */
export default function BookmarkButton({ bookmarked, pending = false, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? '질문 북마크 해제' : '질문 북마크'}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-500 hover:bg-primary-200 disabled:cursor-wait ${pending ? 'opacity-60' : ''}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M6 3h12v18l-6-4-6 4V3z" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
