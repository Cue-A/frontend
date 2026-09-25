import {
  IconChartLine,
  IconFolder,
  IconHome,
  IconLogout,
  IconMicrophone,
  IconUser,
  IconUsers,
} from '@tabler/icons-react'
import { NavLink, Outlet, useMatches } from 'react-router-dom'

import { useLogout } from '@/domain/auth/hooks/useLogout'

import { ROUTES } from '../routes'

/**
 * 사이드바 메뉴입니다. 시안(A-05)의 6개를 그대로 두되, 아직 화면이 없는
 * 곳은 `to` 를 비워둡니다. 갈 곳 없는 링크를 눌러 404 로 떨어지는 것보다,
 * 준비 중이라고 보이는 편이 낫습니다.
 *
 * 아이콘은 Tabler outline 입니다 (docs/design-system.md §7).
 */
const NAV_ITEMS: { label: string; Icon: typeof IconHome; to?: string }[] = [
  { label: '홈', Icon: IconHome, to: ROUTES.LANDING },
  { label: '면접 연습', Icon: IconMicrophone, to: ROUTES.SESSION_SETUP },
  { label: '내 보관함', Icon: IconFolder, to: ROUTES.LIBRARY_DOCUMENTS },
  { label: '성장 관리', Icon: IconChartLine },
  { label: '마이페이지', Icon: IconUser },
  { label: '커뮤니티', Icon: IconUsers },
]

const SLOT_CLASS = 'flex h-11 w-11 items-center justify-center rounded-md transition-colors'
const ACTIVE_CLASS = 'bg-primary-100 text-primary-600'
const INACTIVE_CLASS = 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700'

/** 시안의 아이콘은 24px · stroke 2 입니다. */
const ICON_SIZE = 24
const ICON_STROKE = 2

/**
 * 로그인 이후 화면의 공통 껍데기입니다. (A-05 시안 기준)
 *
 * 시안에는 상단 헤더바가 없고, 사이드바는 아이콘만 있는 좁은 레일입니다.
 * 글자가 없으므로 각 칸에 `title` 과 스크린리더용 이름을 따로 답니다.
 */
/**
 * 라우트의 `handle` 로 이 레이아웃에 알려줄 수 있는 것입니다.
 *
 * `fullBleed` — 본문 여백을 레이아웃이 아니라 화면이 직접 정합니다. 보관함(C-02)처럼
 * 두 번째 패널이 아이콘 레일에 바로 붙는 화면에 씁니다. 여백을 레이아웃이 주면 패널이
 * 레일에서 떨어져 보입니다. 옵션 설정(A-05)처럼 안 쓰는 화면은 지금과 같습니다.
 */
export type AppLayoutHandle = { fullBleed?: boolean }

function isFullBleed(handle: unknown): boolean {
  return typeof handle === 'object' && handle !== null && (handle as AppLayoutHandle).fullBleed === true
}

export default function AppLayout() {
  const fullBleed = useMatches().some((match) => isFullBleed(match.handle))
  const logout = useLogout()

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        aria-label="사이드바"
        className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col items-center gap-8 rounded-r-lg bg-neutral-0 py-6 md:flex"
      >
        <p aria-label="Cue&amp;A" className="text-h2 text-primary-600">
          C
        </p>

        <nav aria-label="주요 메뉴" className="flex-1">
          <ul className="flex flex-col gap-2">
            {NAV_ITEMS.map(({ label, Icon, to }) => (
              <li key={label}>
                {to ? (
                  <NavLink
                    to={to}
                    end
                    title={label}
                    className={({ isActive }) =>
                      `${SLOT_CLASS} ${isActive ? ACTIVE_CLASS : INACTIVE_CLASS}`
                    }
                  >
                    <Icon size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden />
                    <span className="sr-only">{label}</span>
                  </NavLink>
                ) : (
                  <span
                    aria-disabled
                    title={`${label} (준비 중이에요)`}
                    className={`${SLOT_CLASS} text-neutral-300`}
                  >
                    <Icon size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden />
                    <span className="sr-only">{label} (준비 중)</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => void logout()}
          title="로그아웃"
          className={`${SLOT_CLASS} ${INACTIVE_CLASS}`}
        >
          <IconLogout size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden />
          <span className="sr-only">로그아웃</span>
        </button>
      </aside>

      <main className={`min-w-0 flex-1 ${fullBleed ? '' : 'p-6 md:p-10'}`}>
        <Outlet />
      </main>
    </div>
  )
}
