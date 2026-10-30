import { ROUTES } from '@/app/routes'
import { useLogout } from '@/domain/auth/hooks/useLogout'
import { toTopBarProfile, useMe } from '@/domain/user/hooks/useMe'
import Breadcrumb from '@/shared/ui/Breadcrumb'
import TopBarActions from '@/shared/ui/TopBarActions'

/**
 * 보관함 화면에만 있는 상단 줄입니다. 다른 화면의 레이아웃은 바꾸지 않습니다. (이슈 #59)
 *
 * 오른쪽 알림 · 프로필 묶음은 홈 대시보드도 같이 써서 `shared/ui/TopBarActions` 로 옮겼습니다.
 * 프로필 메뉴의 로그아웃(#69 의 `useLogout`)과 마이페이지가 동작합니다.
 * 왼쪽 현재 위치 줄은 연습 기록도 같이 써서 `shared/ui/Breadcrumb` 로 옮겼습니다.
 */
export default function LibraryTopBar() {
  const me = useMe()
  const logout = useLogout()

  return (
    <div className="flex items-center justify-between gap-4">
      <Breadcrumb items={['내 보관함', '자소서 · 포트폴리오']} />
      <TopBarActions profile={toTopBarProfile(me)} myPageTo={ROUTES.MYPAGE} onLogout={logout} />
    </div>
  )
}
