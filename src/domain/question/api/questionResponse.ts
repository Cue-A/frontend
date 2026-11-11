import type { BookmarkedQuestion, BookmarkType, CommonQuestion } from '../types/question'

/**
 * 질문 은행 서버 응답 모양입니다.
 *
 * - 북마크(`/api/bookmarks`)는 백엔드에 있습니다(Cue-A/backend#118). 응답 모양은 그 `BookmarkResponse` 와 같습니다
 * - 공통 질문(`/api/common-questions`)도 백엔드에 있습니다. 프론트 임시안대로 들어와서 모양이 같습니다 (이슈 #201)
 *
 * 응답이 바뀌면 이 파일의 변환 함수와 목업(`questionMock.ts`)만 고칩니다. 화면은 `types/question.ts` 만 봅니다.
 */

/** `GET /api/bookmarks` 한 줄 */
export type BookmarkResponse = {
  sessionId: string
  questionId: string
  type: BookmarkType
  questionText: string
  category: string | null
  difficulty: string | null
  originalQuestionText: string | null
  memo: string | null
  companyName: string | null
  jobRole: string
  bookmarkedAt: string
}

export type BookmarkListResponse = {
  bookmarks: BookmarkResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** `PATCH /api/bookmarks/{sessionId}/{questionId}` — 저장된 메모. 지웠으면 null */
export type BookmarkMemoResponse = {
  memo: string | null
}

/**
 * 공통 질문 한 줄. 백엔드 `CommonQuestionResponse` 와 같습니다. 프론트가 먼저 정한 임시안(PR #195)대로 들어왔습니다.
 * - `GET /api/common-questions` — `{ questions: [...] }`. **정렬하지 않은 기본 순서 그대로** 오고, 즐겨찾기를 위로 올리는
 *   정렬은 프론트(`orderCommon`)가 합니다. 그래야 즐겨찾기를 푼 질문이 새로고침 직후에도 원래 자리로 돌아갑니다
 * - `PUT …/{questionId}/favorite` 본문 `{ favorite }` — 바뀔 상태를 보내고, 이미 그 상태면 그대로 성공. 꺼도 메모는 남습니다
 * - `PATCH …/{questionId}/memo` 본문 `{ memo }` — 처음 쓰기 · 수정 · 삭제가 한 API, 비우면 삭제, 최대 500자. 응답 `{ memo }`
 * - `POST /api/common-questions` 본문 `{ text, category }` — 내 질문 추가. `text` 는 앞뒤 공백을 자른 뒤 1~200자, `category` 는
 *   인성 · 경험 · 지원동기 · 직무 · 기타 중 하나(`QUESTION_CATEGORIES`). 내 질문은 100개까지(409 `CUSTOM_QUESTION_LIMIT_EXCEEDED`)
 * - `PATCH …/{questionId}` 본문 `{ text, category }` — 내 질문만 고칩니다(기본 질문이면 403). 즐겨찾기 · 메모는 그대로
 * - `DELETE …/{questionId}` — 내 질문만 지웁니다. 메모 · 즐겨찾기도 함께 지워지고, 이미 없으면 404 `QUESTION_NOT_FOUND`
 */
export type CommonQuestionResponse = {
  questionId: string
  text: string
  category: string
  favorite: boolean
  favoritedAt: string | null
  memo: string | null
  /** 내가 직접 추가한 질문이면 true */
  custom: boolean
}

/** `POST` · `PATCH /api/common-questions` 본문 */
export type CommonQuestionRequest = {
  text: string
  category: string
}

export type CommonQuestionListResponse = {
  questions: CommonQuestionResponse[]
}

/** `PUT /api/common-questions/{questionId}/favorite` */
export type CommonFavoriteResponse = {
  favorite: boolean
}

export function toBookmarkedQuestion(response: BookmarkResponse): BookmarkedQuestion {
  return {
    sessionId: response.sessionId,
    questionId: response.questionId,
    type: response.type,
    text: response.questionText,
    category: response.category,
    originalText: response.originalQuestionText,
    memo: response.memo,
    companyName: response.companyName,
    jobRole: response.jobRole,
    bookmarkedAt: response.bookmarkedAt,
  }
}

export function toCommonQuestion(response: CommonQuestionResponse): CommonQuestion {
  return {
    questionId: response.questionId,
    text: response.text,
    category: response.category,
    favorite: response.favorite,
    favoritedAt: response.favoritedAt,
    memo: response.memo,
    custom: response.custom,
  }
}
