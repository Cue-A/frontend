type Props = {
  onClick?: () => void
}

/**
 * 상단바 좌측 X 버튼입니다. 클릭 시 종료 확인 모달을 띄우는 건 B-01-4 의 몫이라
 * 여기서는 onClick 을 그대로 위임만 합니다.
 */
export default function ExitButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="면접 종료"
      className="flex h-11 w-11 items-center justify-center rounded-full bg-stage-surface/70 text-stage-text hover:bg-stage-surface"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    </button>
  )
}
