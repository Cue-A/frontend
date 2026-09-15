type Props = {
  active: boolean
}

/** "듣는 중" — 파형 아이콘 + primary/100 배경. */
export default function ListeningIndicator({ active }: Props) {
  return (
    <span
      className={`flex h-13 w-fit items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-body text-primary-500 ${active ? '' : 'opacity-50'}`}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 10v4M8 6v12M12 3v18M16 6v12M20 10v4" strokeLinecap="round" />
      </svg>
      듣는 중
    </span>
  )
}
