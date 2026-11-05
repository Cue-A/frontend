import { ROUTES } from '@/app/routes'
import { useLogout } from '@/domain/auth/hooks/useLogout'
import { toTopBarProfile, useMe } from '@/domain/user/hooks/useMe'
import TopBarActions from '@/shared/ui/TopBarActions'

/**
 * 성장 관리의 상단 줄입니다. 시안에는 오른쪽 알림 · 프로필만 있고 현재 위치 줄이 없습니다 — 사이드바의 한 칸짜리
 * 메뉴라 "내 보관함 / …" 처럼 거쳐 온 단계가 없습니다.
 */
export default function GrowthTopBar() {
  const me = useMe()
  const logout = useLogout()

  return (
    <div className="flex items-center justify-end gap-4">
      <TopBarActions profile={toTopBarProfile(me)} myPageTo={ROUTES.MYPAGE} onLogout={logout} />
    </div>
  )
}
