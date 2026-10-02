import { IconChevronRight } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

import { useMe } from '../hooks/useMe'

import MyPageHeader from './MyPageHeader'

/**
 * 시안의 여섯 메뉴를 그대로 두되, 아직 화면이 없는 곳은 `to` 를 비워 "준비 중" 으로 그립니다.
 * 아이콘 레일과 같은 규칙입니다 — 눌러서 404 로 떨어지는 것보다 준비 중이라고 보이는 편이 낫습니다.
 */
const MENU: { label: string; to?: string }[] = [
  { label: '프로필' },
  { label: '나만의 명함 생성' },
  { label: '관심 기업' },
  { label: '관심 질문' },
  { label: '계정 설정', to: ROUTES.MYPAGE_ACCOUNT },
  { label: '알림 설정' },
]

/** 리스트 행은 `radius-sm` 입니다 (docs/design-system.md §4). 시안의 행은 그림자 없이 흰 판입니다 */
const ROW_CLASS = 'flex items-center justify-between rounded-sm bg-neutral-0 px-5 py-5 text-body-md font-semibold'

/**
 * 마이페이지 메뉴 목록입니다. (마이페이지 시안)
 *
 * 지금 열린 건 계정 설정(로그아웃 · 회원 탈퇴)뿐입니다. 나머지는 MVP 밖이라 준비 중으로 둡니다.
 */
export default function MyPage() {
  const me = useMe()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <MyPageHeader title="마이페이지" me={me} />

      <nav aria-label="마이페이지 메뉴">
        <ul className="flex flex-col gap-2.5">
          {MENU.map(({ label, to }) => (
            <li key={label}>
              {to ? (
                <Link
                  to={to}
                  className={`${ROW_CLASS} text-neutral-900 transition-shadow hover:shadow-card`}
                >
                  {label}
                  <IconChevronRight size={16} stroke={2} aria-hidden className="text-neutral-400" />
                </Link>
              ) : (
                <span aria-disabled className={`${ROW_CLASS} text-neutral-400`}>
                  {label}
                  <span className="text-micro font-normal">준비 중</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
