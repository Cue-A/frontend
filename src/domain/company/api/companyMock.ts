import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { CompanyInterestResponse } from '../types/company'

/**
 * 관심 기업 목업입니다. 백엔드 `CompanyInterestController`(#101)를 따랐습니다.
 *
 * 기업 이름은 옵션 설정의 기업 목록 목업(`interview/api/sessionMock.ts` 의 `COMPANIES`)과 id 를 맞춰 둡니다. 다른 도메인의
 * api 를 가져다 쓰지 않는 규칙이라 여기에 따로 둡니다. 기업 탐색 화면에서 기업 목록 목업을 이 도메인으로 옮길 때 한 곳으로
 * 모읍니다. (이슈 #162 두 번째 PR)
 */
const MOCK_COMPANY_NAMES: Record<number, string> = {
  1: '네이버',
  2: '당근',
  3: '라인',
  4: '우아한형제들',
  5: '카카오',
  6: '쿠팡',
  7: '토스',
}

/** 등록한 순서대로 쌓고, 응답은 최근에 등록한 순서입니다. 처음에는 시안처럼 두 곳을 넣어 둡니다 */
let interests: number[] = [1, 5]

const MISSING = '관심 기업 API 가 배포 서버에 없음 (backend#101 dev 머지, 재배포 전)'

function toCompanyId(raw: string): number {
  const id = Number(raw)
  // 서버는 등록된(verified) 기업만 받습니다. 없는 기업이면 404 입니다
  if (!Number.isSafeInteger(id) || !(id in MOCK_COMPANY_NAMES)) {
    throw new ApiError('COMPANY_NOT_FOUND', '기업을 찾을 수 없습니다')
  }
  return id
}

registerMock(
  'GET',
  '/api/companies/interests',
  (): CompanyInterestResponse[] =>
    [...interests].reverse().map((companyId) => ({ companyId, name: MOCK_COMPANY_NAMES[companyId] })),
  { missingInBackend: MISSING },
)

registerMock(
  'POST',
  '/api/companies/:companyId/interest',
  ({ companyId }) => {
    const id = toCompanyId(companyId)
    if (!interests.includes(id)) interests = [...interests, id]
    return undefined
  },
  { missingInBackend: MISSING },
)

registerMock(
  'DELETE',
  '/api/companies/:companyId/interest',
  ({ companyId }) => {
    // 해제는 없는 기업이어도 그대로 200 입니다(멱등)
    interests = interests.filter((id) => String(id) !== companyId)
    return undefined
  },
  { missingInBackend: MISSING },
)
