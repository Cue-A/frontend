/**
 * 관심 기업 한 건입니다. (`GET /api/companies/interests`, Cue-A/backend `CompanyInterestResponse` · #101)
 *
 * 서버는 목록 표시에 필요한 기업 id · 이름만 줍니다. 업종 · 인재상은 기업 상세(`GET /api/companies/{companyId}`)에 있습니다.
 * id 는 화면에서 **문자열로** 씁니다 — 주소(`/companies/:companyId`)와 옵션 설정의 기업 id 가 문자열이라 맞춥니다. (이슈 #149)
 */
export type CompanyInterest = {
  companyId: string
  name: string
}

/** 서버 응답 모양입니다. id 가 숫자입니다 */
export type CompanyInterestResponse = {
  companyId: number
  name: string
}
