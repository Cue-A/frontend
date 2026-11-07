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
 * - `GET /api/common-questions` — `{ questions: [...] }`. **정렬하지 않은 기본 순서 그대로** `favorite` · `favoritedAt` 만
 *   붙여 내려 주세요. 즐겨찾기를 위로 올리는 정렬은 프론트(`orderCommon`)가 합니다. 그래야 즐겨찾기를 푼 질문이
 *   새로고침 직후에도 원래 자리로 돌아갑니다
 * - `PUT /api/common-questions/{questionId}/favorite` — 본문 `{ favorite: true | false }`. 바뀔 상태를 보내고, 이미 그
 *   상태면 아무것도 바꾸지 않고 성공합니다 (북마크 `PUT .../bookmark` 와 같은 방식)
 * - `PATCH /api/common-questions/{questionId}/memo` — 본문 `{ memo }`. 공통 질문은 모두가 같이 보고 메모 · 즐겨찾기는
 *   내 것이라, 경로로 구분했습니다(질문 자체를 고치는 API 로 읽히지 않게). 북마크 메모와 같은 규칙입니다(처음 쓰기 · 수정 · 삭제가
 *   한 API, 비우면 삭제, 최대 500자). 응답 `{ memo }`
 * - `POST /api/common-questions` — 본문 `{ text, category }`. 내가 직접 추가한 질문을 만들고 `CommonQuestionResponse`
 *   (`custom: true`)를 돌려줍니다. 내 질문은 나만 봅니다. 목록(`GET`)에는 기본 질문과 함께 내려 주세요.
 *   `text` 는 공백만이면 400 `INVALID_REQUEST`, 최대 200자. `category` 는 인성 · 경험 · 지원동기 · 직무 · 기타 중 하나입니다
 * - `PATCH /api/common-questions/{questionId}` — 본문 `{ text, category }`. 내가 추가한 질문만 고칠 수 있습니다
 *   (기본 질문이면 403). 응답은 `CommonQuestionResponse`
 * - `DELETE /api/common-questions/{questionId}` — 내가 추가한 질문만 지울 수 있습니다. 메모 · 즐겨찾기도 함께 지워집니다.
 *   이미 없으면 404 `QUESTION_NOT_FOUND`
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
