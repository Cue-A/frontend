import { IconBuildingSkyscraper, IconX } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { ROUTES, toCompany } from '@/app/routes'
import { useCompanyInterests } from '@/domain/company/hooks/useCompanyInterests'
import { initialOf } from '@/shared/lib/initialOf'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useMe } from '../hooks/useMe'

import MyPageHeader from './MyPageHeader'
import MyPageTitle from './MyPageTitle'

/**
 * 마이페이지 > 관심 기업 — 관심 등록한 기업 목록과 해제. (B-03 마이페이지/관심기업 시안)
 *
 * 목록과 해제는 company 도메인의 훅이 맡습니다(Cue-A/backend #101). 등록은 기업 탐색 화면에서 해서, 위쪽과 빈 목록 안내에
 * "기업 둘러보기" 를 둡니다. 기업 이름을 누르면 그 기업의 상세(인재상)로 갑니다. (이슈 #162)
 *
 * 시안의 기업마다 다른 원 색 · 한 줄 소개(예: "도전과 몰입을 중시하는 인재")는 넣지 않았습니다. 관심 기업 응답에 기업 id · 이름만
 * 있어서입니다. 원 안에는 기업명 첫 글자를 씁니다.
 */
export default function InterestsPage() {
  const me = useMe()
  const state = useCompanyInterests()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <MyPageHeader title={<MyPageTitle current="관심 기업" />} me={me} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-sm text-neutral-500">기업 탐색에서 관심 기업을 등록하면 여기에 모여요.</p>
        <Button size="sm" to={ROUTES.COMPANIES}>
          <IconBuildingSkyscraper size={16} stroke={2} aria-hidden />
          기업 둘러보기
        </Button>
      </div>

      {state.status === 'loading' && (
        <Card padding="lg" label="관심 기업">
          <p className="text-body-md text-neutral-500">불러오는 중…</p>
        </Card>
      )}

      {state.status === 'error' && (
        <Card padding="lg" label="관심 기업">
          <p role="alert" className="text-body-md text-neutral-500">
            관심 기업을 불러오지 못했어요. {state.error}
          </p>
        </Card>
      )}

      {state.status === 'ready' && (
        <>
          {state.actionError && (
            <p role="alert" className="text-body-sm text-semantic-danger">
              {state.actionError}
            </p>
          )}

          {state.interests.length === 0 ? (
            <Card padding="lg" label="관심 기업" className="flex flex-col items-start gap-3">
              <p className="text-body-md text-neutral-500">아직 관심 등록한 기업이 없어요. 기업별 인재상을 둘러보고 관심 기업을 등록해 보세요.</p>
              <Button size="sm" variant="primary" to={ROUTES.COMPANIES}>
                기업 둘러보기
              </Button>
            </Card>
          ) : (
            <ul aria-label="관심 기업" className="flex flex-col gap-2.5">
              {state.interests.map((company) => (
                <li key={company.companyId}>
                  <Card padding="md" className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-body-sm font-semibold text-primary-600"
                      >
                        {initialOf(company.name)}
                      </span>
                      <Link
                        to={toCompany(company.companyId)}
                        className="truncate rounded-xs text-body-md font-semibold text-neutral-900 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-primary-500"
                      >
                        {company.name}
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => state.remove(company)}
                      aria-label={`${company.name} 관심 기업 해제`}
                      className="rounded-sm p-1 text-neutral-400 transition-colors hover:text-neutral-700"
                    >
                      <IconX size={18} stroke={2} aria-hidden />
                    </button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
