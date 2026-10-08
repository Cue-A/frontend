import { Outlet, useMatches } from 'react-router-dom'

import { useLogout } from '@/domain/auth/hooks/useLogout'

import SideNav from './SideNav'

/**
 * 라우트의 `handle` 로 이 레이아웃에 알려줄 수 있는 것입니다.
 *
 * `fullBleed` — 본문 여백을 레이아웃이 아니라 화면이 직접 정합니다. 홈(A-04)처럼 화면 전체에 배경을 깔아야 하는
 * 화면에 씁니다. 여백을 레이아웃이 주면 배경이 여백 안쪽에만 깔립니다. 안 쓰는 화면은 지금과 같습니다.
 * (보관함 C-02 도 두 번째 패널을 레일에 붙이려고 쓰다가, 패널을 사이드바 하위 메뉴로 옮기면서 뺐습니다.)
 */
export type AppLayoutHandle = { fullBleed?: boolean }

function isFullBleed(handle: unknown): boolean {
  return typeof handle === 'object' && handle !== null && (handle as AppLayoutHandle).fullBleed === true
}

/**
 * 로그인 이후 화면의 공통 껍데기입니다. (A-05 시안 기준)
 *
 * 시안에는 상단 헤더바가 없고, 왼쪽은 아이콘 레일입니다. 레일에 마우스를 올리면 메뉴 이름이 보이게 펼쳐지고,
 * 내 보관함처럼 하위 항목이 있는 메뉴는 그 아래로 하위 항목이 열립니다. 사이드바는 SideNav.tsx 에 따로 뒀습니다.
 *
 * `data-app-layout` 은 이 껍데기가 화면에 있는지 index.css 가 알아보는 표시입니다. 있으면 세로 스크롤바 자리를
 * 늘 비워 둬서, 목록이 짧아져 스크롤바가 사라져도 본문이 옆으로 밀리지 않습니다. `fullBleed` 화면(홈)은 배경을
 * 화면이 직접 깔아서 비워 둔 자리와 색이 달라지므로 `data-full-bleed` 로 빼 둡니다.
 */
export default function AppLayout() {
  const fullBleed = useMatches().some((match) => isFullBleed(match.handle))
  const logout = useLogout()

  return (
    <div data-app-layout data-full-bleed={fullBleed || undefined} className="flex min-h-screen bg-neutral-50">
      <SideNav onLogout={logout} />

      <main className={`min-w-0 flex-1 ${fullBleed ? '' : 'p-6 md:p-10'}`}>
        <Outlet />
      </main>
    </div>
  )
}
