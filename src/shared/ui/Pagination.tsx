import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useRef } from 'react'

type Props = {
  /** 지금 페이지. **0부터** 셉니다 — 백엔드 목록 응답(`page`)과 같습니다 */
  page: number
  /** 전체 페이지 수. 0 이나 1 이면 두 버튼이 다 잠깁니다 */
  totalPages: number
  onChange: (page: number) => void
}

const PAGE_BUTTON =
  'flex h-8 w-8 items-center justify-center rounded-sm border border-neutral-300 bg-neutral-0 text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-neutral-0'

/**
 * 이전 · 다음 페이지 버튼입니다. (보관함 시안 pagination — 목록 아래 오른쪽)
 *
 * 시안에는 화살표 두 개만 있어서 쪽 번호는 보이지 않게 두고, 스크린리더에만 "3쪽 중 1쪽" 을 읽어 줍니다.
 * 버튼이 잠긴 이유(첫 쪽 · 마지막 쪽)는 화살표 모양으로 알 수 있어 따로 적지 않습니다.
 *
 * 마지막 쪽으로 넘어가면 누른 "다음" 버튼이 잠기면서 포커스가 화면 밖으로 빠집니다. 키보드로 넘기던 사람이 제자리를
 * 잃지 않게, 그때는 포커스를 반대쪽 버튼으로 옮깁니다. 첫 쪽으로 돌아올 때도 같습니다.
 */
export default function Pagination({ page, totalPages, onChange }: Props) {
  const lastPage = Math.max(totalPages, 1) - 1
  const current = Math.min(Math.max(page, 0), lastPage)
  const previousRef = useRef<HTMLButtonElement | null>(null)
  const nextRef = useRef<HTMLButtonElement | null>(null)

  const goTo = (target: number) => {
    onChange(target)
    if (target <= 0) nextRef.current?.focus()
    else if (target >= lastPage) previousRef.current?.focus()
  }

  return (
    <nav aria-label="페이지" className="flex items-center gap-2">
      <span className="sr-only" aria-live="polite">
        {lastPage + 1}쪽 중 {current + 1}쪽
      </span>
      <button
        ref={previousRef}
        type="button"
        disabled={current <= 0}
        onClick={() => goTo(current - 1)}
        className={PAGE_BUTTON}
      >
        <IconChevronLeft size={16} stroke={2} aria-hidden />
        <span className="sr-only">이전 페이지</span>
      </button>
      <button
        ref={nextRef}
        type="button"
        disabled={current >= lastPage}
        onClick={() => goTo(current + 1)}
        className={PAGE_BUTTON}
      >
        <IconChevronRight size={16} stroke={2} aria-hidden />
        <span className="sr-only">다음 페이지</span>
      </button>
    </nav>
  )
}
