import type { BookmarkedQuestion, BookmarkType, CommonQuestion } from '../types/question'

/**
 * 질문 은행 서버 응답 모양입니다.
 *
 * - 북마크(`/api/bookmarks`)는 백엔드에 있습니다(Cue-A/backend#118). 응답 모양은 그 `BookmarkResponse` 와 같습니다
 * - 공통 질문(`/api/common-questions`)은 **명세가 없어서 프론트가 정한 임시안**입니다
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
 * TODO(백엔드): 공통 질문 API 가 없습니다. 기본 공통 질문을 담는 테이블도 ERD 에 없습니다. 프론트 제안은
 * `GET /api/common-questions` 가 `{ questions: [{ questionId, text, category }] }` 를 주는 것입니다.
 */
export type CommonQuestionResponse = {
  questionId: string
  text: string
  category: string
}

export type CommonQuestionListResponse = {
  questions: CommonQuestionResponse[]
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
  return { questionId: response.questionId, text: response.text, category: response.category }
}
