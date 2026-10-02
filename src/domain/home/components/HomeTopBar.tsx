import { IconSettings } from '@tabler/icons-react'

import { useLogout } from '@/domain/auth/hooks/useLogout'
import { toTopBarProfile, type UseMeResult } from '@/domain/user/hooks/useMe'
import TopBarActions from '@/shared/ui/TopBarActions'

/**
 * 시안 오른쪽 위의 색 점 네 개. 화면 테마를 고르는 자리로 보이는데 테마 · 다크모드는 MVP 밖이고
 * (docs/design-system.md §1.4) 정해진 색도 없어서, **모양만 두고 누를 수 없게** 둡니다.
 * 첫 칸(테두리만 있는 원)이 지금 테마입니다.
 */
const THEME_SWATCH_CLASSES = ['bg-primary-200', 'bg-badge-success-bg', 'bg-badge-danger-bg']

function ThemeSwatches() {
  return (
    <span
      title="화면 테마 (준비 중이에요)"
      className="flex h-10 items-center gap-2 rounded-full bg-neutral-0 px-3 shadow-card"
    >
      <span aria-hidden className="h-4 w-4 rounded-full border-2 border-primary-500 bg-neutral-0" />
      {THEME_SWATCH_CLASSES.map((swatch) => (
        <span key={swatch} aria-hidden className={`h-4 w-4 rounded-full ${swatch}`} />
      ))}
      <span className="sr-only">화면 테마 바꾸기 (준비 중)</span>
    </span>
  )
}

type Props = {
  /** 화면이 이미 부른 `useMe()` 결과. 인사말과 같이 써서 `users/me` 가 두 번 나가지 않게 넘겨받습니다 */
  me: UseMeResult
}

/**
 * 홈 오른쪽 위 줄 — 테마(장식) · 설정(준비 중) · 알림 · 프로필.
 *
 * 알림 · 프로필은 보관함과 같은 `TopBarActions` 입니다. 톱니바퀴는 시안에 갈 곳이 적혀 있지 않고 설정 화면
 * (마이페이지 > 계정 설정)도 아직 없어서, 사이드바의 준비 중 메뉴처럼 흐리게 두고 마우스를 올리면 알려줍니다.
 */
export default function HomeTopBar({ me }: Props) {
  const logout = useLogout()

  return (
    <div className="flex items-center justify-end gap-3">
      <ThemeSwatches />

      <span
        aria-disabled
        title="설정 (준비 중이에요)"
        className="flex h-10 w-10 items-center justify-center rounded-sm bg-neutral-0 text-neutral-300 shadow-card"
      >
        <IconSettings size={20} stroke={2} aria-hidden />
        <span className="sr-only">설정 (준비 중)</span>
      </span>

      <TopBarActions profile={toTopBarProfile(me)} onLogout={logout} />
    </div>
  )
}
