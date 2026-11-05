import { api } from '@/shared/api/apiClient'

import type { BookmarkedQuestion, CommonQuestion } from '../types/question'

import {
  toBookmarkedQuestion,
  toCommonQuestion,
  type BookmarkListResponse,
  type BookmarkMemoResponse,
  type CommonQuestionListResponse,
} from './questionResponse'

import './questionMock'

/** 서버가 허용하는 한 쪽 최대 크기입니다. 이보다 크게 보내면 100 으로 맞춰집니다 */
const BOOKMARK_PAGE_SIZE = 100
/** 안전장치. 북마크가 이보다 많아도 최신 500개까지만 받습니다 (한 쪽 100 × 5쪽) */
const MAX_BOOKMARK_PAGES = 5

async function getBookmarkPage(page: number) {
  const response = await api.get<BookmarkListResponse>(`/api/bookmarks?page=${page}&size=${BOOKMARK_PAGE_SIZE}`)
  return { bookmarks: response.bookmarks.map(toBookmarkedQuestion), totalPages: response.totalPages }
}

/**
 * 질문 은행 목록. `GET /api/bookmarks?page=&size=` — 내가 담은 질문을 **담은 순서의 최신순**으로 줍니다.
 *
 * 서버에는 필터도 검색도 없어서, 검색은 화면이 받아 둔 목록에서 합니다. 쪽 단위로만 받을 수 있으니 **전부 모아서**
 * 돌려줍니다 (한 쪽 100개). 첫 쪽의 `totalPages` 를 보고 나머지 쪽을 한꺼번에 받습니다.
 *
 * 백엔드에 있습니다(Cue-A/backend#118). `VITE_REAL_APIS` 에 `bookmarks` 를 넣어야 실제 서버로 가고, 아니면 목업이 답합니다.
 */
export async function getAllBookmarks(): Promise<BookmarkedQuestion[]> {
  const first = await getBookmarkPage(0)
  const lastPage = Math.min(first.totalPages, MAX_BOOKMARK_PAGES)

  const rest = await Promise.all(Array.from({ length: Math.max(lastPage - 1, 0) }, (_, index) => getBookmarkPage(index + 1)))
  return [first, ...rest].flatMap((page) => page.bookmarks)
}

/**
 * 메모 쓰기 · 고치기. `PATCH /api/bookmarks/{sessionId}/{questionId}` — **처음 쓰기와 수정이 같은 API** 입니다.
 * 빈 값(null · 빈 문자열 · 공백뿐)을 보내면 메모가 지워지고 북마크는 남습니다. 최대 500자입니다.
 * 돌려주는 값이 저장된 메모입니다(지웠으면 null) — 화면은 이 값으로 줄을 갱신합니다.
 */
export async function updateBookmarkMemo(sessionId: string, questionId: string, memo: string) {
  const response = await api.patch<BookmarkMemoResponse>(bookmarkPath(sessionId, questionId), { memo })
  return response.memo
}

/**
 * 질문 은행에서 빼기. `DELETE /api/bookmarks/{sessionId}/{questionId}` — **메모도 함께 지워집니다.**
 * 끝난 면접의 질문은 빼면 다시 담을 수 없어서, 화면이 먼저 확인을 받습니다 (BookmarkRemoveDialog).
 * 이미 없으면 404 `BOOKMARK_NOT_FOUND` 입니다.
 */
export function deleteBookmark(sessionId: string, questionId: string) {
  return api.delete<void>(bookmarkPath(sessionId, questionId))
}

function bookmarkPath(sessionId: string, questionId: string) {
  return `/api/bookmarks/${encodeURIComponent(sessionId)}/${encodeURIComponent(questionId)}`
}

/**
 * 공통 질문 목록. `GET /api/common-questions`
 *
 * **백엔드에 없는 API 입니다.** 경로 · 응답 모양 모두 프론트 임시안이고 목업이 답합니다 (questionResponse.ts).
 */
export async function getCommonQuestions(): Promise<CommonQuestion[]> {
  const response = await api.get<CommonQuestionListResponse>('/api/common-questions')
  return response.questions.map(toCommonQuestion)
}
