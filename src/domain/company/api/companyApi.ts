import { api } from '@/shared/api/apiClient'
import { ApiError } from '@/shared/api/apiError'

import type {
  Company,
  CompanyDetail,
  CompanyDetailResponse,
  CompanyInterest,
  CompanyInterestResponse,
  CompanyResponse,
} from '../types/company'

import './companyMock'

/**
 * 기업 도메인 API 입니다. (Cue-A/backend #86 · #101 · 이슈 #162) `VITE_REAL_APIS` 이름은 `companies` 입니다.
 *
 * 목록 · 상세는 **검증된(verified=true) 기업만** 나옵니다. 없는 기업과 검증되지 않은 기업은 상세 조회 · 관심 등록이
 * `COMPANY_NOT_FOUND`(404) 입니다.
 *
 * 관심 기업은 **기업 id 로만** 등록 · 해제합니다. 둘 다 멱등이라 이미 등록된 기업을 다시 등록하거나, 등록하지 않은
 * 기업을 해제해도 200 입니다.
 */

function toCompany(response: CompanyResponse): Company {
  return { companyId: String(response.companyId), name: response.name }
}

function toInterest(response: CompanyInterestResponse): CompanyInterest {
  return { companyId: String(response.companyId), name: response.name }
}

/** 기업 목록. `GET /api/companies` — 이름 오름차순. 면접 옵션 설정의 기업 고르기와 같은 API 입니다 */
export async function getCompanies(): Promise<Company[]> {
  const list = await api.get<CompanyResponse[]>('/api/companies')
  return list.map(toCompany)
}

/**
 * 기업 상세. `GET /api/companies/{companyId}`
 *
 * 서버는 숫자 id 만 받습니다. 주소에 숫자가 아닌 값이 오면 서버에 묻지 않고 `COMPANY_NOT_FOUND` 로 봅니다 — 서버로 보내면
 * 관심 기업 목록 경로(`/interests`)와 겹치거나 400 이 되어, 화면이 "없는 기업"과 다른 문구를 보여줍니다.
 */
export async function getCompanyDetail(companyId: string): Promise<CompanyDetail> {
  if (!/^\d+$/.test(companyId)) {
    throw new ApiError('COMPANY_NOT_FOUND', '기업을 찾을 수 없습니다')
  }
  const response = await api.get<CompanyDetailResponse>(`/api/companies/${companyId}`)
  return {
    companyId: String(response.companyId),
    name: response.name,
    industry: response.industry,
    valuesFormat: response.valuesFormat,
    coreValues: response.coreValues ?? [],
    talentProfile: response.talentProfile?.trim() ? response.talentProfile : null,
  }
}

/** 내 관심 기업. 최근에 등록한 순서입니다. 없으면 빈 배열입니다 */
export async function getCompanyInterests(): Promise<CompanyInterest[]> {
  const list = await api.get<CompanyInterestResponse[]>('/api/companies/interests')
  return list.map(toInterest)
}

/** 관심 기업 등록. `POST /api/companies/{companyId}/interest` */
export function addCompanyInterest(companyId: string) {
  return api.post<void>(`/api/companies/${encodeURIComponent(companyId)}/interest`)
}

/** 관심 기업 해제. `DELETE /api/companies/{companyId}/interest` */
export function removeCompanyInterest(companyId: string) {
  return api.delete<void>(`/api/companies/${encodeURIComponent(companyId)}/interest`)
}
