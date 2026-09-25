import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** 모달 제목 요소의 id. 스크린리더가 "무엇에 대한 대화상자인지" 읽게 연결합니다. */
  labelledBy: string
  /** 레이아웃만 넣어주세요. 색·radius·그림자는 여기서 정합니다 */
  className?: string
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 공용 모달입니다. 뒤 배경을 어둡게 깔고 가운데에 판을 띄웁니다.
 *
 * `radius-lg`(20px) · `elevation-float` 는 카드와 같은 반경이지만 그림자가 더
 * 강한 전용 토큰입니다 (docs/design-system.md §4, §6 — "모달, 드롭다운").
 * `Card` 를 재사용하지 않는 이유는 `Card` 가 `shadow-card` 를 고정으로 쓰고
 * 있어서, className 으로 덮어쓰면 Tailwind 생성 순서에 따라 무시될 수 있기
 * 때문입니다 (`Card.tsx` 상단 주석 참고).
 *
 * `aria-modal="true"` 는 "배경은 지금 상호작용 대상이 아니다"라는 선언이라,
 * 포커스 트랩 없이 쓰면 키보드·스크린리더 사용자에게는 거짓말이 된다. 그래서
 * 열릴 때 포커스를 판 안으로 옮기고, Tab 이 판 밖으로 못 나가게 가두고,
 * 닫히면 열기 전 포커스로 되돌린다.
 */
export default function Modal({ open, onClose, children, labelledBy, className = '' }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // 부모가 렌더마다 새 onClose 를 넘겨도(예: 콜백을 useCallback 없이 넘기는 경우) 아래
  // effect 가 매번 정리→재실행되며 포커스를 판으로 되돌리는 일이 없도록, 최신 값만
  // ref 로 들고 effect 의존성에서는 뺀다.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // 열려있는 동안 뒤 화면이 스크롤되면 모달이 배경과 같이 밀려 보입니다.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // 판 안에 포커스 가능한 요소가 없어도(문구만 있는 모달 등) 항상 옮겨지도록
    // 판 자신을 대상으로 삼는다 (tabIndex=-1).
    dialogRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.offsetParent !== null,
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      // 배경 클릭만 닫히게: 판 내부 클릭이 버블링돼 올라온 것과 구분하려고
      // 이 div 자신이 이벤트 타깃일 때만 닫습니다.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={['rounded-lg bg-neutral-0 p-6 shadow-float outline-none', className].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </div>
  )
}
