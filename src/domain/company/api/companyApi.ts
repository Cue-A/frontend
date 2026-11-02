import { api } from '@/shared/api/apiClient'

import type { CompanyInterest, CompanyInterestResponse } from '../types/company'

import './companyMock'

/**
 * 기업 도메인 API 입니다. (Cue-A/backend #101 · 이슈 #162) `VITE_REAL_APIS` 이름은 `companies` 입니다.
 *
 * 관심 기업은 **기업 id 로만** 등록 · 해제합니다. 둘 다 멱등이라 이미 등록된 기업을 다시 등록하거나, 등록하지 않은
 * 기업을 해제해도 200 입니다. 검증되지 않은(verified=false) 기업과 없는 기업은 등록하면 `COMPANY_NOT_FOUND`(404) 입니다.
 *
 * 백엔드 dev 에는 머지됐지만 배포 서버에는 아직 없어서, 재배포 전까지는 목업(`missingInBackend`)이 답합니다.
 */

function toInterest(response: CompanyInterestResponse): CompanyInterest {
  return { companyId: String(response.companyId), name: response.name }
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
