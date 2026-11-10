import { useEffect, useId, useRef } from 'react'

import Button from '@/shared/ui/Button'

import { useLogout } from '../hooks/useLogout'

type Props = {
  /** 로그아웃하지 않고 창이 닫힌 뒤 */
  onClose: () => void
}

/**
 * 로그아웃 전에 한 번 묻습니다.
 *
 * 로그아웃 버튼이 있는 곳은 모두 이 창을 거칩니다 — 프로필 화면의 계정 칸, 사이드바(아이콘 레일) 맨 아래, 상단 프로필 메뉴.
 * 전에는 프로필 계정 칸에서만 묻고 레일 · 프로필 메뉴는 바로 로그아웃했는데, 레일은 맨 아래라 마우스를 내리다 잘못 누르기
 * 쉬워서 모두 묻기로 했습니다 (이슈 #186). 계정 칸 밖에서는 `useLogoutConfirm` 으로 엽니다.
 *
 * 다른 도메인의 TopBar 도 쓰는 창이라 user 가 아니라 로그아웃이 속한 auth 도메인에 둡니다
 * (docs/01-conventions.md — 도메인 간 참조는 hooks 레벨에서만).
 *
 * - 창을 열면 포커스가 "취소" 에 있습니다
 * - 로그아웃은 #69 의 `useLogout` 을 그대로 부릅니다. 로컬 세션을 먼저 지우고 로그인 화면으로 보내서
 *   기다릴 일이 없으므로, "로그아웃하는 중" 상태를 따로 두지 않습니다
 */
export default function LogoutConfirmDialog({ onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const logout = useLogout()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <div className="flex flex-col gap-2 px-6 py-5">
        <p id={headingId} className="text-h2 text-neutral-900">
          로그아웃할까요?
        </p>
        <p className="break-keep text-body-md text-neutral-700">
          이 브라우저에서만 로그아웃돼요. 면접 기록과 리포트는 그대로 남아서, 다시 로그인하면 이어서 볼 수 있어요.
        </p>
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
        <Button size="sm" onClick={() => dialogRef.current?.close()}>
          취소
        </Button>
        <Button variant="primary" size="sm" onClick={logout}>
          로그아웃
        </Button>
      </div>
    </dialog>
  )
}
