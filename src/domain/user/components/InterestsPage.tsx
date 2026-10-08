import { IconX } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'
import { initialOf } from '@/shared/lib/initialOf'
import Card from '@/shared/ui/Card'

import { useCompanyInterests } from '../hooks/useCompanyInterests'

const title = (
  <>
    <Link to={ROUTES.MYPAGE} className="transition-colors hover:text-primary-600">
      마이페이지
    </Link>{' '}
    · 관심 기업
  </>
)

/**
 * B-03 마이페이지/관심기업.
 *
 * 추가는 기업 탐색(CMP-2) 화면 몫이라 여기서는 해제만 합니다. 그 화면이 생기면 거기서
 * `userApi.addCompanyInterest` 를 씁니다.
 */
export default function InterestsPage() {
  const state = useCompanyInterests()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="flex flex-col gap-3">
        <h1 className="text-h1 text-neutral-900">{title}</h1>
      </header>

      <Card padding="none" label="관심 기업" className="w-full max-w-2xl divide-y divide-neutral-200">
        {state.status === 'loading' && <p className="p-5 text-body-md text-neutral-500">불러오는 중…</p>}
        {state.status === 'error' && (
          <p role="alert" className="p-5 text-body-md text-neutral-500">
            {state.error}
          </p>
        )}
        {state.status === 'ready' && state.interests.length === 0 && (
          <p className="p-5 text-body-md text-neutral-500">아직 관심 등록한 기업이 없어요.</p>
        )}
        {state.status === 'ready' &&
          state.interests.map((company) => (
            <div key={company.companyId} className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-body-md font-semibold text-primary-600">
                  {initialOf(company.name)}
                </span>
                <div>
                  <p className="text-body-md font-semibold text-neutral-900">{company.name}</p>
                  <p className="text-body-sm text-neutral-500">{company.tagline}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => state.remove(company.companyId)}
                aria-label={`${company.name} 관심 기업 해제`}
                className="rounded-sm p-1 text-neutral-400 transition-colors hover:text-neutral-700"
              >
                <IconX size={18} stroke={2} aria-hidden />
              </button>
            </div>
          ))}
      </Card>
    </div>
  )
}
