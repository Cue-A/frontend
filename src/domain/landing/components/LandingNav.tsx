import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'

/**
 * 랜딩 상단 바입니다. (A-01)
 * 로그인 전 화면이라 앱 사이드바 대신 이 바만 씁니다.
 *
 * 로고는 시안에서 이미지로 들어가 있습니다. 아직 내보내지 않아서 글자로 둡니다.
 */
export default function LandingNav() {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 bg-neutral-0 px-6 py-4 md:px-12">
      <Link to={ROUTES.LANDING} className="text-h2 text-primary-600">
        Cue&amp;A
      </Link>

      <nav className="flex flex-wrap items-center gap-6">
        <a
          href="#features"
          className="text-body-md text-neutral-700 transition-colors hover:text-neutral-900"
        >
          서비스 소개
        </a>

        <Link
          to={ROUTES.LOGIN}
          className="text-body-md text-neutral-700 transition-colors hover:text-neutral-900"
        >
          로그인
        </Link>

        <Button variant="primary" size="sm" to={ROUTES.LOGIN}>
          무료로 시작하기
        </Button>
      </nav>
    </header>
  )
}
