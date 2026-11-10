import { useCallback, useState, type ReactNode } from 'react'

import LogoutConfirmDialog from '../components/LogoutConfirmDialog'

export type UseLogoutConfirmResult = {
  /** 로그아웃 버튼의 `onClick` 에 넘깁니다. 바로 로그아웃하지 않고 확인 창을 엽니다 */
  openLogoutConfirm: () => void
  /** 화면 아무 데나 그려 둡니다. 닫혀 있을 때는 `null` 입니다 */
  logoutConfirmDialog: ReactNode
}

/**
 * 로그아웃 확인 창(`LogoutConfirmDialog`)을 여닫습니다. 사이드바와 상단 프로필 메뉴의 로그아웃이 씁니다 (이슈 #186).
 *
 * 창 컴포넌트는 auth 도메인 것이라, 다른 도메인의 TopBar 는 컴포넌트를 직접 가져오지 않고 이 훅으로 엽니다
 * (docs/01-conventions.md — 도메인 간 참조는 hooks 레벨에서만).
 *
 * ```tsx
 * const { openLogoutConfirm, logoutConfirmDialog } = useLogoutConfirm()
 * <TopBarActions onLogout={openLogoutConfirm} ... />
 * {logoutConfirmDialog}
 * ```
 */
export function useLogoutConfirm(): UseLogoutConfirmResult {
  const [open, setOpen] = useState(false)
  const openLogoutConfirm = useCallback(() => setOpen(true), [])

  return {
    openLogoutConfirm,
    logoutConfirmDialog: open ? <LogoutConfirmDialog onClose={() => setOpen(false)} /> : null,
  }
}
