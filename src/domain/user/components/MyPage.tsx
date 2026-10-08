import { IconChevronRight } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

import { useMe } from '../hooks/useMe'

import MyPageHeader from './MyPageHeader'

/**
 * 시안의 여섯 메뉴입니다. "관심 질문" 은 기록(REC) 도메인 몫이라 그 화면이 생기기 전까지
 * `to` 를 비워 "준비 중" 으로 그립니다 — 아이콘 레일과 같은 규칙입니다.
 */
const MENU: { label: string; to?: string }[] = [
  { label: '프로필', to: ROUTES.MYPAGE_PROFILE },
  { label: '나만의 명함 생성', to: ROUTES.MYPAGE_BUSINESS_CARD },
  { label: '관심 기업', to: ROUTES.MYPAGE_INTERESTS },
  { label: '관심 질문' },
  { label: '계정 설정', to: ROUTES.MYPAGE_ACCOUNT },
  { label: '알림 설정', to: ROUTES.MYPAGE_NOTIFICATIONS },
]

/** 리스트 행은 `radius-sm` 입니다 (docs/design-system.md §4). 시안의 행은 그림자 없이 흰 판입니다 */
const ROW_CLASS = 'flex items-center justify-between rounded-sm bg-neutral-0 px-5 py-5 text-body-md font-semibold'

/**
 * 마이페이지 메뉴 목록입니다. (마이페이지 시안)
 *
 * "관심 질문" 만 기록(REC) 도메인 화면이 아직 없어 준비 중입니다. 나머지는 목업으로 동작합니다
 * (백엔드 API 는 전부 시작 전 — 각 화면 주석 참고).
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
