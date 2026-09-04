import { Outlet } from 'react-router-dom'

/**
 * 로그인 이후 화면의 공통 껍데기입니다.
 * 사이드바·헤더는 자리만 잡아두었고, 실제 컴포넌트는 shared/ui 작업에서 채웁니다.
 * 색·타이포는 디자인 토큰이 머지된 뒤에 입힙니다. (여기서 색을 하드코딩하지 마세요)
 */
export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside
        aria-label="사이드바"
        className="w-60 shrink-0 border-r p-4"
        data-placeholder="Sidebar"
      >
        사이드바 자리
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 shrink-0 items-center border-b px-6"
          data-placeholder="HeaderBar"
        >
          헤더 자리
        </header>

        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
