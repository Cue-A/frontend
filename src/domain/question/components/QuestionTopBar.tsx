import { ROUTES } from '@/app/routes'
import { useLogout } from '@/domain/auth/hooks/useLogout'
import { toTopBarProfile, useMe } from '@/domain/user/hooks/useMe'
import Breadcrumb from '@/shared/ui/Breadcrumb'
import TopBarActions from '@/shared/ui/TopBarActions'

/**
 * 질문 은행의 상단 줄입니다. 자소서 · 포트폴리오의 `LibraryTopBar`, 연습 기록의 `PracticeTopBar` 와 같은 모양이고
 * 현재 위치 글자만 다릅니다. 다른 도메인의 컴포넌트를 가져다 쓰지 않는 규칙(docs/01-conventions.md "폴더")이라
 * 연습 기록처럼 같은 부품으로 따로 짰습니다.
 */
export default function QuestionTopBar() {
  const me = useMe()
  const logout = useLogout()

  return (
    <div className="flex items-center justify-between gap-4">
      <Breadcrumb items={['내 보관함', '질문 은행']} />
      <TopBarActions profile={toTopBarProfile(me)} myPageTo={ROUTES.MYPAGE} onLogout={logout} />
    </div>
  )
}
