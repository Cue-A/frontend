import { NavLink, Outlet } from 'react-router-dom'

import { ROUTES } from '../routes'

/**
 * 사이드바 메뉴입니다. 시안(A-05)의 6개를 그대로 두되, 아직 화면이 없는
 * 곳은 `to` 를 비워둡니다. 갈 곳 없는 링크를 눌러 404 로 떨어지는 것보다,
 * 준비 중이라고 보이는 편이 낫습니다.
 */
const NAV_ITEMS: { label: string; to?: string }[] = [
  { label: '홈', to: ROUTES.LANDING },
  { label: '면접 연습', to: ROUTES.SESSION_SETUP },
  { label: '내 보관함' },
  { label: '성장 관리' },
  { label: '마이페이지' },
  { label: '커뮤니티' },
]

const ITEM_CLASS = 'block rounded-md px-4 py-3 text-body-md transition-colors'
const ACTIVE_CLASS = 'bg-primary-100 font-semibold text-primary-700'
const INACTIVE_CLASS = 'text-neutral-700 hover:bg-neutral-50'

/**
 * 로그인 이후 화면의 공통 껍데기입니다. (A-05 기준)
 *
 * 시안에는 상단 헤더바가 없어서 사이드바 하나만 둡니다.
 *
 * 아이콘은 아직 없습니다. 시안은 메뉴마다 아이콘이 붙지만 아이콘 라이브러리를
 * 아직 안 정했고, 글자만으로도 어디로 가는지는 읽힙니다. 별도 이슈로 넣습니다.
 */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        aria-label="사이드바"
        className="hidden w-60 shrink-0 flex-col gap-8 bg-neutral-0 p-4 md:flex"
      >
        <p className="px-4 py-2 text-h2 text-primary-600">Cue&amp;A</p>

        <nav aria-label="주요 메뉴">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <NavLink
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      `${ITEM_CLASS} ${isActive ? ACTIVE_CLASS : INACTIVE_CLASS}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <span
                    aria-disabled
                    title="준비 중이에요"
                    className={`${ITEM_CLASS} text-neutral-400`}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-6 md:p-12">
        <Outlet />
      </main>
    </div>
  )
}
