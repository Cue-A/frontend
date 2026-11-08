import { IconArrowLeft, IconPlayerPlay } from '@tabler/icons-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { COMPANY_FROM_PARAM, ROUTES, toSessionSetup } from '@/app/routes'
import { toUserMessage } from '@/shared/api/errorMessage'
import { initialOf } from '@/shared/lib/initialOf'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useCompanyDetail } from '../hooks/useCompanyDetail'
import { useCompanyInterests } from '../hooks/useCompanyInterests'
import type { CompanyDetail, ValuesFormat } from '../types/company'

import CompanyTopBar from './CompanyTopBar'
import InterestButton from './InterestButton'

/** 핵심 가치 칸의 제목 옆 설명. 기업이 가치를 어떤 모양으로 적었는지 알려줍니다 (백엔드 `ValuesFormat`) */
const VALUES_FORMAT_LABEL: Record<ValuesFormat, string> = {
  WORD: '가치를 한 단어로 정리했어요',
  PRINCIPLE: '가치를 행동 원칙으로 정리했어요',
  MIXED: '가치 이름과 행동 원칙을 함께 정리했어요',
}

type BackTarget = {
  to: string
  /** 돌아가기 링크 글자. 없는 기업 안내 버튼은 뒤에 "으로" 를 붙여 씁니다 */
  label: string
}

/**
 * 상세에서 돌아갈 곳. 관심 기업에서 들어왔으면(`?from=interests`) 관심 기업으로, 아니면 기업 탐색으로 갑니다 (이슈 #186).
 * 전에는 늘 기업 탐색으로 가서, 관심 기업에서 들어온 사람은 보던 화면을 잃었습니다. 모르는 값은 기업 탐색으로 떨어뜨립니다.
 */
function useBackTarget(): BackTarget {
  const [searchParams] = useSearchParams()
  if (searchParams.get(COMPANY_FROM_PARAM) === 'interests') {
    return { to: ROUTES.MYPAGE_INTERESTS, label: '관심 기업' }
  }
  return { to: ROUTES.COMPANIES, label: '기업 목록' }
}

function BackLink({ target }: { target: BackTarget }) {
  return (
    <Link
      to={target.to}
      className="inline-flex items-center gap-1 self-start rounded-xs text-body-sm font-semibold text-neutral-500 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary-500"
    >
      <IconArrowLeft size={16} stroke={2} aria-hidden />
      {target.label}
    </Link>
  )
}

function CompanyBody({ company }: { company: CompanyDetail }) {
  const interests = useCompanyInterests()

  return (
    <>
      <Card padding="lg" className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-h2 text-primary-600"
          >
            {initialOf(company.name)}
          </span>
          <div className="min-w-0">
            <h1 className="break-keep text-h1 text-neutral-900">{company.name}</h1>
            <p className="mt-1 break-keep text-body-md text-neutral-500">{company.industry}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {interests.status === 'ready' && (
            <InterestButton
              withLabel
              companyName={company.name}
              interested={interests.isInterested(company.companyId)}
              pending={interests.isPending(company.companyId)}
              onToggle={() =>
                interests.isInterested(company.companyId) ? interests.remove(company) : interests.add(company)
              }
            />
          )}
          <Button variant="primary" to={toSessionSetup(company.companyId)}>
            <IconPlayerPlay size={16} stroke={2} aria-hidden />이 기업으로 면접 연습하기
          </Button>
        </div>
      </Card>

      {interests.status === 'ready' && interests.actionError && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          {interests.actionError}
        </p>
      )}
      {interests.status === 'error' && (
        <p role="alert" className="text-body-sm text-semantic-danger">
          관심 기업을 불러오지 못해서 관심 등록 버튼을 숨겼어요. {interests.error}
        </p>
      )}

      {company.talentProfile && (
        <Card padding="lg" label="인재상">
          <h2 className="text-h2 text-neutral-900">인재상</h2>
          <p className="mt-3 whitespace-pre-line break-keep text-body-md text-neutral-700">{company.talentProfile}</p>
        </Card>
      )}

      <Card padding="lg" label="핵심 가치">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-h2 text-neutral-900">핵심 가치</h2>
          <p className="text-body-sm text-neutral-500">{VALUES_FORMAT_LABEL[company.valuesFormat]}</p>
        </div>

        {company.coreValues.length === 0 ? (
          <p className="mt-4 text-body-md text-neutral-500">등록된 핵심 가치가 없어요.</p>
        ) : (
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {company.coreValues.map((value, index) => (
              <li key={`${index}-${value.name}`} className="flex gap-3 rounded-md bg-neutral-50 p-4">
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-body-sm font-semibold text-primary-600"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="break-keep text-body-md font-semibold text-neutral-900">{value.name}</p>
                  {value.indicator && (
                    <p className="mt-1 break-keep text-body-sm text-neutral-500">{value.indicator}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  )
}

/**
 * 기업 상세 — 업종 · 핵심 가치 · 행동지표, 관심 등록 · 해제, "이 기업으로 면접 연습하기". (이슈 #162)
 *
 * 시안이 없어 다른 화면의 카드 모양을 따랐습니다. "이 기업으로 면접 연습하기" 는 옵션 설정으로 가면서 기업 맞춤 질문을
 * 켜고 이 기업을 골라 둡니다 (`toSessionSetup`). 상세는 검증된 기업만 열려서, 옵션 설정의 기업 목록에도 늘 있습니다.
 *
 * 없는 기업 · 검증되지 않은 기업(`COMPANY_NOT_FOUND`)은 다시 시도해도 같아서 목록으로만 안내합니다.
 */
export default function CompanyDetailPage() {
  const { companyId = '' } = useParams()
  const detail = useCompanyDetail(companyId)

  const backTarget = useBackTarget()
  const name = detail.status === 'ready' ? detail.company.name : '기업 상세'

  return (
    <div className="mx-auto flex w-full max-w-312 flex-col gap-6">
      <CompanyTopBar items={['기업 탐색', name]} />
      <BackLink target={backTarget} />

      {detail.status === 'loading' && <p className="text-body-md text-neutral-500">기업 정보를 불러오는 중이에요…</p>}

      {detail.status === 'error' && (
        <Card padding="lg" label="기업 상세">
          <div role="alert" className="flex flex-wrap items-center gap-3">
            <p className="text-body-md text-neutral-700">
              {detail.error.code === 'COMPANY_NOT_FOUND'
                ? '찾는 기업이 없어요. 목록에서 다시 골라 주세요.'
                : `기업 정보를 불러오지 못했어요. ${toUserMessage(detail.error.code)}`}
            </p>
            {detail.error.code === 'COMPANY_NOT_FOUND' ? (
              <Button size="sm" to={backTarget.to}>
                {backTarget.label}으로
              </Button>
            ) : (
              <Button size="sm" onClick={detail.reload}>
                다시 시도
              </Button>
            )}
          </div>
        </Card>
      )}

      {detail.status === 'ready' && <CompanyBody company={detail.company} />}
    </div>
  )
}
