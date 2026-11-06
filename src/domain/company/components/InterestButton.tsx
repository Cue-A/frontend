import { IconHeart, IconHeartFilled } from '@tabler/icons-react'

type Props = {
  companyName: string
  interested: boolean
  /** 서버에 알리는 중. 누르면 무시됩니다 */
  pending: boolean
  onToggle: () => void
  /** 아이콘 옆에 글자("관심 기업")를 붙입니다. 기업 상세의 버튼 줄에서 씁니다 */
  withLabel?: boolean
}

/**
 * 관심 기업 등록 · 해제 버튼입니다. 켜짐 · 꺼짐은 `aria-pressed` 가 알립니다. (질문 은행의 북마크 별과 같은 방식)
 *
 * 이름까지 "등록 · 해제" 로 바꾸면 "해제, 눌림" 처럼 거꾸로 읽혀서 이름은 그대로 둡니다.
 * `disabled` 로 잠그면 키보드로 누른 순간 포커스가 빠져서, 서버에 보내는 동안은 `aria-disabled` 로 상태만 알리고 연타는
 * 훅(`useCompanyInterests`)이 막습니다.
 */
export default function InterestButton({ companyName, interested, pending, onToggle, withLabel = false }: Props) {
  const icon = interested ? (
    <IconHeartFilled size={20} aria-hidden className="text-primary-500" />
  ) : (
    <IconHeart size={20} stroke={2} aria-hidden className="text-neutral-400" />
  )

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={interested}
      aria-disabled={pending || undefined}
      className={`flex shrink-0 items-center justify-center gap-2 rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary-500 aria-disabled:cursor-wait ${
        withLabel
          ? 'border border-neutral-300 px-4 py-2.5 text-body-md font-semibold text-neutral-900 hover:bg-neutral-50'
          : 'h-9 w-9 hover:bg-neutral-50'
      }`}
    >
      {icon}
      {withLabel ? (
        <>
          관심 기업
          <span className="sr-only"> — {companyName}</span>
        </>
      ) : (
        <span className="sr-only">관심 기업 — {companyName}</span>
      )}
    </button>
  )
}
