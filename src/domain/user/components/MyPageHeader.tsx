import type { ReactNode } from 'react'

import { ROUTES } from '@/app/routes'
import { useLogout } from '@/domain/auth/hooks/useLogout'
import TopBarActions from '@/shared/ui/TopBarActions'

import { toTopBarProfile, type UseMeResult } from '../hooks/useMe'

type Props = {
  title: ReactNode
  /** 화면이 이미 부른 `useMe()` 결과. 헤더가 따로 부르면 같은 화면에서 `users/me` 가 두 번 나갑니다 */
  me: UseMeResult
}

/**
 * 마이페이지 화면들의 머리입니다. 오른쪽 위 알림 · 프로필, 그 아래 화면 제목. (마이페이지 시안)
 */
export default function MyPageHeader({ title, me }: Props) {
  const logout = useLogout()

  return (
    <header className="flex flex-col gap-3">
      <div className="flex justify-end">
        <TopBarActions profile={toTopBarProfile(me)} myPageTo={ROUTES.MYPAGE} onLogout={logout} />
      </div>
      <h1 className="text-h1 text-neutral-900">{title}</h1>
    </header>
  )
}
