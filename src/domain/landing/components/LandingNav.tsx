import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

/**
 * 랜딩 상단 바입니다. (A-01)
 * 로그인 전 화면이라 앱 사이드바 대신 이 바만 씁니다.
 */
export default function LandingNav() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
      <Link to={ROUTES.LANDING}>Cue&amp;A</Link>

      <nav className="flex flex-wrap items-center gap-4">
        <a href="#features">서비스 소개</a>

        <Link to={ROUTES.LOGIN}>로그인</Link>

        <Link to={ROUTES.LOGIN} className="border px-4 py-2">
          무료로 시작하기
        </Link>
      </nav>
    </header>
  )
}
