import { IconClock, IconFileText, IconHelpCircle } from '@tabler/icons-react'
import { NavLink } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

import { MAX_DOCUMENTS } from '../lib/documentDisplay'

const ICON_SLOT = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-sm'

type Props = {
  /** 등록한 문서 수. 아직 모르면(불러오는 중 · 실패) null */
  documentCount: number | null
}

/**
 * 내 보관함의 두 번째 패널입니다. 아이콘 레일(AppLayout) 바로 옆에 붙습니다.
 *
 * - 연습 기록 · 질문 은행은 MVP 밖이라 **"준비 중" 비활성**입니다. 시안의 숫자 뱃지는
 *   세어줄 API 가 없어서 뺐습니다. 아이콘 레일의 준비 중 메뉴와 같은 방식입니다.
 * - 시안 아래쪽의 "저장 용량 1.9GB / 5GB" 는 **문서 개수**로 바꿨습니다. 용량을 알려주는
 *   API 가 없고, 실제 상한도 용량이 아니라 20개입니다. (이슈 #59)
 */
export default function LibraryPanel({ documentCount }: Props) {
  const ratio = documentCount === null ? 0 : Math.min(documentCount / MAX_DOCUMENTS, 1)

  return (
    <aside
      aria-label="내 보관함"
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-l border-neutral-200 bg-neutral-0 px-4 py-8 lg:flex"
    >
      <p className="px-2 text-h2 text-neutral-900">내 보관함</p>

      <nav aria-label="보관함 메뉴" className="flex-1">
        <ul className="flex flex-col gap-1">
          <li>
            <NavLink
              to={ROUTES.LIBRARY_DOCUMENTS}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-2 py-2 transition-colors ${
                  isActive ? 'bg-primary-100' : 'hover:bg-neutral-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`${ICON_SLOT} ${isActive ? 'bg-primary-500 text-neutral-0' : 'bg-neutral-50 text-neutral-500'}`}>
                    <IconFileText size={20} stroke={2} aria-hidden />
                  </span>
                  <span className="flex-1 text-body-md font-semibold text-neutral-900">자소서 · 포트폴리오</span>
                  {documentCount !== null && (
                    <span className="rounded-full bg-primary-200 px-2 text-body-sm font-semibold text-primary-700">
                      {documentCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>

          {[
            { label: '연습 기록', Icon: IconClock },
            { label: '질문 은행', Icon: IconHelpCircle },
          ].map(({ label, Icon }) => (
            <li key={label}>
              <span aria-disabled className="flex items-center gap-3 px-2 py-2">
                <span className={`${ICON_SLOT} bg-neutral-50 text-neutral-300`}>
                  <Icon size={20} stroke={2} aria-hidden />
                </span>
                <span className="flex-1 text-body-md text-neutral-400">{label}</span>
                <span className="text-micro text-neutral-400">준비 중</span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="등록한 문서 수" className="rounded-lg bg-neutral-50 p-4">
        <p className="text-body-sm font-semibold text-neutral-900">등록한 문서</p>
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={MAX_DOCUMENTS}
          aria-valuenow={documentCount ?? 0}
          aria-label="등록한 문서 수"
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200"
        >
          <div className="h-full rounded-full bg-primary-500" style={{ width: `${ratio * 100}%` }} />
        </div>
        <p className="mt-2 break-keep text-micro text-neutral-500">
          {documentCount ?? '-'} / {MAX_DOCUMENTS}개 · 20개까지 등록할 수 있어요
        </p>
      </section>
    </aside>
  )
}
