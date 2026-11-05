import { IconChevronRight } from '@tabler/icons-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { toCompany } from '@/app/routes'
import { toUserMessage } from '@/shared/api/errorMessage'
import { initialOf } from '@/shared/lib/initialOf'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import SearchField from '@/shared/ui/SearchField'

import { useCompanies } from '../hooks/useCompanies'
import { useCompanyInterests, type UseCompanyInterestsResult } from '../hooks/useCompanyInterests'
import type { Company } from '../types/company'

import CompanyTopBar from './CompanyTopBar'
import InterestButton from './InterestButton'

/** 검색어와 견줄 때 대소문자 · 띄어쓰기를 가리지 않습니다. "lg cns" 로도 "LG CNS" 를 찾습니다 */
function normalize(text: string) {
  return text.replace(/\s+/g, '').toLowerCase()
}

function CompanyCard({ company, interests }: { company: Company; interests: UseCompanyInterestsResult }) {
  return (
    <Card padding="md" className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-body-md font-semibold text-primary-600"
          >
            {initialOf(company.name)}
          </span>
          <h2 className="break-keep text-body-lg font-semibold text-neutral-900">{company.name}</h2>
        </div>

        {/* 관심 기업을 아직 못 받았으면 지금 상태를 몰라서 버튼을 그리지 않습니다 */}
        {interests.status === 'ready' && (
          <InterestButton
            companyName={company.name}
            interested={interests.isInterested(company.companyId)}
            pending={interests.isPending(company.companyId)}
            onToggle={() =>
              interests.isInterested(company.companyId) ? interests.remove(company) : interests.add(company)
            }
          />
        )}
      </div>

      <Link
        to={toCompany(company.companyId)}
        className="mt-auto inline-flex items-center gap-1 self-start rounded-xs text-body-sm font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        인재상 보기
        <IconChevronRight size={16} stroke={2} aria-hidden />
        <span className="sr-only"> — {company.name}</span>
      </Link>
    </Card>
  )
}

/**
 * 기업 탐색 — 검증된 기업 목록과 관심 등록 · 해제. (이슈 #162)
 *
 * 시안이 없어 홈의 "기업별 인재상" 카드와 마이페이지 관심 기업의 카드 모양을 따랐습니다. 목록 응답(`GET /api/companies`)에
 * 기업 id · 이름만 있어서 카드에는 이름만 보입니다. 업종 · 핵심 가치는 상세 화면에 있습니다.
 *
 * 검색은 받은 목록 안에서 이름으로 거릅니다. 서버 목록이 스무 곳 남짓이고 검색 조건을 받지 않습니다.
 */
export default function CompaniesPage() {
  const companies = useCompanies()
  const interests = useCompanyInterests()
  const [query, setQuery] = useState('')

  const keyword = normalize(query)
  const shown =
    companies.status === 'ready'
      ? companies.companies.filter((company) => !keyword || normalize(company.name).includes(keyword))
      : []

  return (
    // 1248px = 보관함 화면들과 같은 본문 폭입니다
    <div className="mx-auto flex w-full max-w-312 flex-col gap-6">
      <CompanyTopBar items={['기업 탐색']} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 lg:flex-1">
          <h1 className="text-h1 text-neutral-900">기업 탐색</h1>
          <p className="mt-2 break-keep text-body-md text-neutral-500">
            기업별 인재상과 핵심 가치를 살펴보고, 관심 기업으로 모아 두세요.
          </p>
        </div>
        <SearchField label="기업 검색" placeholder="기업 이름 검색" value={query} onChange={setQuery} />
      </div>

      {interests.status === 'error' && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          관심 기업을 불러오지 못해서 관심 등록 버튼을 숨겼어요. {interests.error}
        </p>
      )}
      {interests.status === 'ready' && interests.actionError && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          {interests.actionError}
        </p>
      )}

      {companies.status === 'loading' && <p className="text-body-md text-neutral-500">기업 목록을 불러오는 중이에요…</p>}

      {companies.status === 'error' && (
        <div role="alert" className="flex flex-wrap items-center gap-3">
          <p className="text-body-md text-semantic-danger">
            기업 목록을 불러오지 못했어요. {toUserMessage(companies.error.code)}
          </p>
          <Button size="sm" onClick={companies.reload}>
            다시 시도
          </Button>
        </div>
      )}

      {companies.status === 'ready' &&
        (shown.length === 0 ? (
          <Card padding="lg" label="기업 목록">
            <p className="text-body-md text-neutral-500">
              {keyword ? '검색어와 맞는 기업이 없어요.' : '아직 등록된 기업이 없어요.'}
            </p>
          </Card>
        ) : (
          <ul aria-label="기업 목록" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((company) => (
              <li key={company.companyId}>
                <CompanyCard company={company} interests={interests} />
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}
