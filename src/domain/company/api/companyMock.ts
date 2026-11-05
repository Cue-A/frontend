import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'
import { MOCK_COMPANIES, type MockCompany } from '@/shared/api/mockCompanies'

import type { CompanyDetailResponse, CompanyInterestResponse, CompanyResponse } from '../types/company'

/**
 * 기업 목업입니다. 백엔드 `CompanyController` · `CompanyInterestController`(#86 · #101)를 따랐습니다.
 *
 * 기업 데이터는 면접 도메인 목업과 같이 쓰려고 `shared/api/mockCompanies.ts` 에 있습니다(백엔드 시드의 검증된 21개).
 * 면접 옵션 설정의 기업 고르기도 같은 `GET /api/companies` 라, 그 목업도 여기서 답합니다.
 */

/** 등록한 순서대로 쌓고, 응답은 최근에 등록한 순서입니다. 처음에는 두 곳을 넣어 둡니다 (SK하이닉스 · 네이버) */
let interests: number[] = [6, 8]

function findCompany(raw: string): MockCompany {
  const id = Number(raw)
  const company = Number.isSafeInteger(id) ? MOCK_COMPANIES.find((item) => item.companyId === id) : undefined
  // 서버는 검증된(verified) 기업만 다룹니다. 없는 기업과 검증되지 않은 기업은 404 입니다
  if (!company) throw new ApiError('COMPANY_NOT_FOUND', '기업을 찾을 수 없습니다')
  return company
}

function nameOf(companyId: number) {
  return MOCK_COMPANIES.find((item) => item.companyId === companyId)?.name ?? ''
}

// 서버는 이름 오름차순입니다(DB 정렬). 한글 · 영문이 섞여 있어 코드 순서로 맞춥니다 — 영문(CJ · KB · LG …)이 한글보다 앞입니다
registerMock('GET', '/api/companies', (): CompanyResponse[] =>
  MOCK_COMPANIES.map(({ companyId, name }) => ({ companyId, name })).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  ),
)

// 경로가 `/api/companies/:companyId` 와도 맞아서, 먼저 등록해 먼저 걸리게 합니다 (shared/api/mock.ts 는 등록 순서대로 찾습니다)
registerMock('GET', '/api/companies/interests', (): CompanyInterestResponse[] =>
  [...interests].reverse().map((companyId) => ({ companyId, name: nameOf(companyId) })),
)

registerMock('GET', '/api/companies/:companyId', ({ companyId }): CompanyDetailResponse => {
  const { coreValues, ...company } = findCompany(companyId)
  return { ...company, coreValues: coreValues.map((value) => ({ ...value })) }
})

registerMock('POST', '/api/companies/:companyId/interest', ({ companyId }) => {
  const { companyId: id } = findCompany(companyId)
  if (!interests.includes(id)) interests = [...interests, id]
  return undefined
})

registerMock('DELETE', '/api/companies/:companyId/interest', ({ companyId }) => {
  // 해제는 없는 기업이어도 그대로 200 입니다(멱등)
  interests = interests.filter((id) => String(id) !== companyId)
  return undefined
})
