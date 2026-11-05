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
 * TODO(백엔드): 공통 질문 API 가 없습니다. 기본 공통 질문을 담는 테이블도 ERD 에 없습니다. **프론트 임시안**입니다.
 * - `GET /api/common-questions` — `{ questions: [...] }`. 즐겨찾기한 질문이 위(가장 최근에 한 것부터), 나머지는 그 뒤에
 *   서버가 정한 순서로 내려 주세요. 프론트는 즐겨찾기를 누르면 바로 위로 올리느라 같은 규칙으로 직접 다시 정렬합니다
 * - `PUT /api/common-questions/{questionId}/favorite` — 본문 `{ favorite: true | false }`. 바뀔 상태를 보내고, 이미 그
 *   상태면 아무것도 바꾸지 않고 성공합니다 (북마크 `PUT .../bookmark` 와 같은 방식)
 * - `PATCH /api/common-questions/{questionId}` — 본문 `{ memo }`. 북마크 메모와 같은 규칙입니다(처음 쓰기 · 수정 · 삭제가
 *   한 API, 비우면 삭제, 최대 500자). 응답 `{ memo }`
 * - 공통 질문은 면접 세션이 없어서 북마크 API 의 키(`sessionId + questionId`)를 쓸 수 없습니다. 즐겨찾기를 풀어도
 *   메모는 남기는 것으로 가정했습니다(다시 담을 수 있어서). 다르게 하려면 알려 주세요
 */
export type CommonQuestionResponse = {
  questionId: string
  text: string
  category: string
  favorite: boolean
  favoritedAt: string | null
  memo: string | null
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
  }
}
