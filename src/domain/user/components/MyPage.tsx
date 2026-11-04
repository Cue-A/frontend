import { IconChevronRight } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

import { useMe } from '../hooks/useMe'

import MyPageHeader from './MyPageHeader'

/**
 * 마이페이지 메뉴입니다. 시안의 여섯 메뉴 중 "관심 질문" 은 뺐습니다 — 질문 은행의 북마크(내 보관함 > 질문 은행)와 같은
 * 기능이라, 따로 만들면 같은 목록이 두 곳에 생깁니다. `to` 가 없는 메뉴는 "준비 중" 으로 그립니다(아이콘 레일과 같은 규칙).
 */
const MENU: { label: string; to?: string }[] = [
  { label: '프로필', to: ROUTES.MYPAGE_PROFILE },
  { label: '나만의 명함 생성', to: ROUTES.MYPAGE_BUSINESS_CARD },
  { label: '관심 기업', to: ROUTES.MYPAGE_INTERESTS },
  { label: '계정 설정', to: ROUTES.MYPAGE_ACCOUNT },
  { label: '알림 설정', to: ROUTES.MYPAGE_NOTIFICATIONS },
]

/** 리스트 행은 `radius-sm` 입니다 (docs/design-system.md §4). 시안의 행은 그림자 없이 흰 판입니다 */
const ROW_CLASS = 'flex items-center justify-between rounded-sm bg-neutral-0 px-5 py-5 text-body-md font-semibold'

/**
 * 마이페이지 메뉴 목록입니다. (마이페이지 시안)
 *
 * 관심 기업은 실제 서버로 동작합니다. 프로필 수정 · 알림 설정 · 명함은 백엔드 시작 전이라 목업이 답합니다.
 * (docs/90-open-questions.md Q16)
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
