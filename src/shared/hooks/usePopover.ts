import { useEffect, useState, type RefObject } from 'react'

/**
 * 바깥을 누르거나 Esc 를 누르면 닫히는 작은 팝오버 상태입니다.
 *
 * 상단 알림 · 프로필 묶음(shared/ui/TopBarActions)과 옵션 설정(A-05)의 시간 · 질문수 도움말(FieldHelp)이 같이 씁니다.
 * 처음엔 알림 · 프로필 파일 안에만 있었는데 쓰는 곳이 세 군데가 되어 여기로 올렸습니다.
 *
 * ref 는 쓰는 쪽이 만들어 넘깁니다. 훅이 ref 를 담은 객체를 돌려주면 React 컴파일러 규칙이
 * 그 객체의 다른 값(`open`)을 읽는 것까지 "렌더 중 ref 접근" 으로 봅니다.
 */
export function usePopover(ref: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, ref])

  return { open, toggle: () => setOpen((value) => !value), close: () => setOpen(false) }
}
