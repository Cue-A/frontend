/**
 * 기업 도메인 타입입니다. (Cue-A/backend `CompanyController` · `CompanyInterestController` · #86 · #101)
 *
 * id 는 화면에서 **문자열로** 씁니다 — 주소(`/companies/:companyId`)와 옵션 설정의 기업 id 가 문자열이라 맞춥니다. (이슈 #149)
 * 서버 응답 모양(`...Response`)은 id 가 숫자이고, api 에서 받을 때 바꿉니다.
 */

/** 기업 목록 한 건 (`GET /api/companies`). 서버는 검증된 기업만, 이름 오름차순으로 id · 이름만 줍니다 */
export type Company = {
  companyId: string
  name: string
}

/**
 * 기업이 핵심 가치를 적어 둔 형식입니다. (백엔드 `ValuesFormat`)
 * - `WORD` 단어형 (예: "도전", "정직")
 * - `PRINCIPLE` 행동원칙형 (예: "고객의 문제부터 정의한다")
 * - `MIXED` 둘이 섞인 형식
 */
export type ValuesFormat = 'WORD' | 'PRINCIPLE' | 'MIXED'

/** 핵심 가치 하나. `indicator` 는 그 가치를 행동으로 옮긴 모습(행동지표)입니다 */
export type CoreValue = {
  name: string
  indicator: string
}

/** 기업 상세 (`GET /api/companies/{companyId}`) */
export type CompanyDetail = {
  companyId: string
  name: string
  /** 예: "반도체/메모리" */
  industry: string
  valuesFormat: ValuesFormat
  coreValues: CoreValue[]
  /** 기업 인재상 설명. 없으면 null 입니다 */
  talentProfile: string | null
}

/**
 * 관심 기업 한 건입니다. (`GET /api/companies/interests`)
 *
 * 서버는 목록 표시에 필요한 기업 id · 이름만 줍니다. 업종 · 인재상은 기업 상세에 있습니다.
 */
export type CompanyInterest = {
  companyId: string
  name: string
}

/** 서버 응답 모양입니다. id 가 숫자입니다 */
export type CompanyResponse = {
  companyId: number
  name: string
}

export type CompanyDetailResponse = Omit<CompanyDetail, 'companyId'> & {
  companyId: number
}

export type CompanyInterestResponse = {
  companyId: number
  name: string
}
