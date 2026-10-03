import { IconHelpCircle } from '@tabler/icons-react'
import { useId, useRef, type ReactNode } from 'react'

import { usePopover } from '@/shared/hooks/usePopover'

type Props = {
  /** 무엇에 대한 설명인지. 버튼 이름("시간 설명 보기")과 설명 창 이름에 씁니다 */
  topic: string
  children: ReactNode
}

/**
 * 항목 이름 옆의 회색 ? 아이콘. 누르면 바로 아래에 설명이 뜨고, 다시 누르거나 바깥을 누르거나 Esc 로 닫힙니다.
 *
 * 마우스를 올리면 뜨는 툴팁이 아니라 **누르는 버튼**으로 둔 이유는 키보드 · 터치에서도 열 수 있어야 해서입니다.
 * 설명이 두세 줄이라 툴팁(`title`)에는 다 들어가지도 않습니다.
 */
export default function FieldHelp({ topic, children }: Props) {
  const rootRef = useRef<HTMLSpanElement | null>(null)
  const popover = usePopover(rootRef)
  const panelId = useId()

  return (
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={popover.toggle}
        aria-expanded={popover.open}
        aria-controls={panelId}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-primary-500 ${
          popover.open ? 'text-neutral-700' : 'text-neutral-400 hover:text-neutral-700'
        }`}
      >
        <IconHelpCircle size={18} stroke={2} aria-hidden />
        <span className="sr-only">{topic} 설명 보기</span>
      </button>

      {popover.open && (
        <span
          id={panelId}
          role="note"
          aria-label={`${topic} 설명`}
          className="absolute left-0 top-full z-10 mt-2 flex w-72 flex-col gap-2 rounded-md bg-neutral-0 p-4 text-left text-body-sm font-normal text-neutral-700 shadow-float"
        >
          {children}
        </span>
      )}
    </span>
  )
}
