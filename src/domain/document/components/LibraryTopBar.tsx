import { useLogout } from '@/domain/auth/hooks/useLogout'
import { toTopBarProfile, useMe } from '@/domain/user/hooks/useMe'
import TopBarActions from '@/shared/ui/TopBarActions'

/**
 * 보관함 화면에만 있는 상단 줄입니다. 다른 화면의 레이아웃은 바꾸지 않습니다. (이슈 #59)
 *
 * 오른쪽 알림 · 프로필 묶음은 홈 대시보드도 같이 써서 `shared/ui/TopBarActions` 로 옮겼습니다.
 * 프로필 메뉴의 로그아웃도 이제 동작합니다(#69 의 `useLogout`). 마이페이지는 화면이 없어 아직 준비 중입니다.
 */
export default function LibraryTopBar() {
  const me = useMe()
  const logout = useLogout()

  return (
    <div className="flex items-center justify-between gap-4">
      <nav aria-label="현재 위치" className="min-w-0 overflow-hidden">
        <ol className="flex items-center gap-2 whitespace-nowrap text-body-sm">
          <li className="text-neutral-500">내 보관함</li>
          <li aria-hidden className="text-neutral-400">
            /
          </li>
          <li aria-current="page" className="font-semibold text-neutral-900">
            자소서 · 포트폴리오
          </li>
        </ol>
      </nav>

      <TopBarActions profile={toTopBarProfile(me)} onLogout={logout} />
    </div>
  )
}
