/**
 * 내 보관함 > 질문 은행 화면 타입입니다. (이슈 #138 → 북마크 개편)
 *
 * 서버 응답 모양은 `api/questionResponse.ts` 에 따로 있습니다 — 서버 필드가 바뀌어도 화면이 흔들리지 않게
 * 변환을 한 겹 둡니다 (docs/01-conventions.md "타입").
 */

/** 질문 종류. 꼬리질문 · 되묻기는 원질문과 함께 담깁니다 */
export type BookmarkType = 'QUESTION' | 'FOLLOWUP' | 'REASK'

/** 면접 중 북마크한 질문 한 줄. `(sessionId, questionId)` 로 한 줄을 가립니다 */
export type BookmarkedQuestion = {
  sessionId: string
  questionId: string
  type: BookmarkType
  text: string
  /** AI 가 준 한글 분류(예: 프로젝트경험). 되묻기는 null */
  category: string | null
  /** 꼬리질문 · 되묻기가 따라온 원질문 문구. 없으면 null */
  originalText: string | null
  /** 내가 쓴 메모. 쓰지 않았으면 null */
  memo: string | null
  /** 회사를 고르지 않은 면접이면 null */
  companyName: string | null
  jobRole: string
  /** ISO 8601. 목록은 이 값의 최신순입니다 */
  bookmarkedAt: string
}

/** 기본으로 들어 있는 공통 질문 */
export type CommonQuestion = {
  questionId: string
  text: string
  /** 화면에 그대로 보여 줄 분류 이름 (인성 · 경험 · 지원동기 …) */
  category: string
  /** 즐겨찾기했는지. 즐겨찾기한 질문이 목록 위에 옵니다 */
  favorite: boolean
  /** 즐겨찾기한 시각(ISO 8601). 즐겨찾기가 아니면 null. 가장 최근에 한 질문이 맨 위입니다 */
  favoritedAt: string | null
  /** 내가 쓴 메모. 쓰지 않았으면 null */
  memo: string | null
}

/** 탭. 북마크가 먼저입니다 */
export type QuestionTab = 'BOOKMARKED' | 'COMMON'
