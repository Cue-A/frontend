import { ROUTES } from '@/app/routes'
import { useLogout } from '@/domain/auth/hooks/useLogout'
import { toTopBarProfile, useMe } from '@/domain/user/hooks/useMe'
import Breadcrumb from '@/shared/ui/Breadcrumb'
import TopBarActions from '@/shared/ui/TopBarActions'

type Props = {
  /** 앞에서부터 차례로. 마지막이 지금 화면입니다 (예: `['기업 탐색', 'SK하이닉스']`) */
  items: string[]
}

/**
 * 기업 탐색의 상단 줄입니다. 연습 기록의 `PracticeTopBar` 와 같은 모양입니다.
 * 다른 도메인의 컴포넌트를 가져다 쓰지 않는 규칙(docs/01-conventions.md "폴더")이라 같은 부품으로 따로 짰습니다.
 */
export default function CompanyTopBar({ items }: Props) {
  const me = useMe()
  const logout = useLogout()

  return (
    <div className="flex items-center justify-between gap-4">
      <Breadcrumb items={items} />
      <TopBarActions profile={toTopBarProfile(me)} myPageTo={ROUTES.MYPAGE} onLogout={logout} />
    </div>
  )
}
