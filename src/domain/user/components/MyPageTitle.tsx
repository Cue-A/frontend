import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

/** 마이페이지 하위 화면의 제목 — "마이페이지 · 프로필". 앞부분을 누르면 메뉴 목록으로 갑니다 (마이페이지 시안) */
export default function MyPageTitle({ current }: { current: string }) {
  return (
    <>
      <Link to={ROUTES.MYPAGE} className="transition-colors hover:text-primary-600">
        마이페이지
      </Link>{' '}
      · {current}
    </>
  )
}
