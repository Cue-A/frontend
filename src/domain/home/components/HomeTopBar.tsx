import { IconSettings } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { MYPAGE_ACCOUNT_ID, ROUTES, toMyPageProfile } from '@/app/routes'
import { useLogoutConfirm } from '@/domain/auth/hooks/useLogoutConfirm'
import { toTopBarProfile, type UseMeResult } from '@/domain/user/hooks/useMe'
import TopBarActions from '@/shared/ui/TopBarActions'

type Props = {
  /** 화면이 이미 부른 `useMe()` 결과. 인사말과 같이 써서 `users/me` 가 두 번 나가지 않게 넘겨받습니다 */
  me: UseMeResult
}

/**
 * 홈 오른쪽 위 줄 — 설정 · 알림 · 프로필.
 *
 * 알림 · 프로필은 보관함과 같은 `TopBarActions` 입니다. 톱니바퀴는 시안에 갈 곳이 적혀 있지 않아서, 설정에 가장
 * 가까운 프로필의 계정 칸으로 보냅니다.
 *
 * 시안의 화면 테마 색 점은 지웠습니다 — 테마 · 다크모드는 MVP 밖이라 누를 수 없는 장식으로만 있었습니다 (이슈 #185).
 */
export default function HomeTopBar({ me }: Props) {
  const { openLogoutConfirm, logoutConfirmDialog } = useLogoutConfirm()

  return (
    <div className="flex items-center justify-end gap-3">
      <Link
        to={toMyPageProfile(MYPAGE_ACCOUNT_ID)}
        title="계정 설정"
        className="flex h-10 w-10 items-center justify-center rounded-sm bg-neutral-0 text-neutral-700 shadow-card transition-colors hover:text-neutral-900"
      >
        <IconSettings size={20} stroke={2} aria-hidden />
        <span className="sr-only">계정 설정</span>
      </Link>

      <TopBarActions profile={toTopBarProfile(me)} myPageTo={ROUTES.MYPAGE_PROFILE} onLogout={openLogoutConfirm} />

      {logoutConfirmDialog}
    </div>
  )
}
