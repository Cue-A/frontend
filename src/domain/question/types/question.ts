/**
 * 내 보관함 > 질문 은행 화면 타입입니다. (이슈 #138)
 *
 * 서버 응답 모양은 `api/questionResponse.ts` 에 따로 있습니다 — 서버 필드가 바뀌어도 화면이 흔들리지 않게
 * 변환을 한 겹 둡니다 (docs/01-conventions.md "타입").
 */

/**
 * 질문의 출처.
 * - `COMMON` 기본으로 들어 있는 공통 질문
 * - `COMPANY` 기업을 골라 본 면접에서 나온 기업 맞춤 질문
 */
export type QuestionOrigin = 'COMMON' | 'COMPANY'

/** 목록 한 줄 */
export type Question = {
  questionId: string
  text: string
  origin: QuestionOrigin
  /** 화면에 그대로 보여 줄 분류 이름 (인성 · 경험 · 지원동기 …) */
  category: string
  /** 기업 맞춤 질문이면 그 기업 이름. 공통 질문이면 null */
  companyName: string | null
  /** 이 질문으로 연습한 횟수. 서버가 세어 주는 값이고, 모르면 null */
  practiceCount: number | null
  /** 내가 북마크했는지 */
  bookmarked: boolean
  /** ISO 8601 */
  createdAt: string
}

export type QuestionPage = {
  /** 최신순입니다 */
  questions: Question[]
  /** 0 부터 */
  page: number
  size: number
  /** 거른 뒤의 전체 개수 */
  totalElements: number
  totalPages: number
}

/** 탭. "공통 질문" 은 `origin` 이 `COMMON` 인 것만, "북마크" 는 내가 북마크한 것만 보입니다 */
export type QuestionTab = 'ALL' | 'COMMON' | 'BOOKMARKED'

export type QuestionListQuery = {
  tab: QuestionTab
  /** 질문 문장에서 찾습니다. 비우면 거르지 않습니다 */
  keyword: string
  /** 0 부터 */
  page: number
  size: number
}
