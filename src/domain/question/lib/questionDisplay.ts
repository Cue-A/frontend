import type { BookmarkedQuestion, BookmarkType, CommonQuestion, QuestionTab } from '../types/question'

/**
 * 질문 은행 화면에 보여줄 글자를 만듭니다. 화면은 이 함수들의 결과만 그립니다.
 */

/** 탭 순서는 북마크가 먼저입니다. 글자 뒤의 개수는 화면이 붙입니다 */
export const QUESTION_TAB_LABEL: Record<QuestionTab, string> = {
  BOOKMARKED: '내 북마크',
  COMMON: '공통 질문',
}

/** 꼬리질문 · 되묻기 줄 앞에 붙는 이름표. 본 질문에는 붙이지 않습니다 */
export const BOOKMARK_TYPE_LABEL: Record<BookmarkType, string | null> = {
  QUESTION: null,
  FOLLOWUP: '꼬리질문',
  REASK: '되묻기',
}

/** 메모는 질문마다 하나이고 최대 500자입니다 (PATCH /api/bookmarks) */
export const MAX_MEMO_LENGTH = 500

/** 같은 질문을 재연습에서 또 담으면 줄이 따로 생겨서, 한 줄은 `(sessionId, questionId)` 둘로 가립니다 */
export function bookmarkKey(bookmark: Pick<BookmarkedQuestion, 'sessionId' | 'questionId'>): string {
  return `${bookmark.sessionId}:${bookmark.questionId}`
}

/** `2026-11-04T14:21:05+09:00` → `11월 4일 연습` (보는 사람의 시간대 기준). 읽을 수 없는 값이면 null */
function practiceDateOf(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getMonth() + 1}월 ${date.getDate()}일 연습`
}

/**
 * 북마크 질문 위의 한 줄. `인성 · 네이버 · 11월 4일 연습`
 * 분류(되묻기는 없음) · 회사(회사를 고르지 않은 면접이면 직무) · 연습한 날(담은 날) 순서이고, 없는 칸은 뺍니다.
 */
export function metaOfBookmark(bookmark: BookmarkedQuestion): string {
  const parts = [bookmark.category, bookmark.companyName ?? bookmark.jobRole, practiceDateOf(bookmark.bookmarkedAt)]
  return parts.filter((part): part is string => Boolean(part)).join(' · ')
}

/** 공통 질문 위의 한 줄. 분류만 보입니다. 이 탭의 질문은 전부 공통이라 "공통" 은 적지 않습니다 */
export function metaOfCommon(question: CommonQuestion): string {
  return question.category
}

/** "메모 N개 · 꼬리질문 N개 · 되묻기 N개" — 카드의 이름표와 같게 꼬리질문과 되묻기를 따로 셉니다 */
export function summarize(bookmarks: readonly BookmarkedQuestion[]) {
  return {
    memoCount: bookmarks.filter((bookmark) => bookmark.memo !== null).length,
    followupCount: bookmarks.filter((bookmark) => bookmark.type === 'FOLLOWUP').length,
    reaskCount: bookmarks.filter((bookmark) => bookmark.type === 'REASK').length,
  }
}

function includes(texts: (string | null)[], needle: string) {
  return texts.some((text) => text?.toLowerCase().includes(needle))
}

/** 질문 · 원질문 · 메모 · 분류 · 회사 · 직무에서 찾습니다. 비우면 거르지 않습니다 */
export function filterBookmarks(bookmarks: readonly BookmarkedQuestion[], keyword: string): BookmarkedQuestion[] {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return [...bookmarks]

  return bookmarks.filter((bookmark) =>
    includes(
      [bookmark.text, bookmark.originalText, bookmark.memo, bookmark.category, bookmark.companyName, bookmark.jobRole],
      needle,
    ),
  )
}

/** 질문 · 분류 · 메모에서 찾습니다 */
export function filterCommon(questions: readonly CommonQuestion[], keyword: string): CommonQuestion[] {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return [...questions]

  return questions.filter((question) => includes([question.text, question.category, question.memo], needle))
}

/**
 * 공통 질문 순서. 즐겨찾기한 질문이 위에, 가장 최근에 한 것부터 옵니다. 나머지는 받아 온 순서 그대로입니다.
 * 즐겨찾기를 누르면 서버 응답을 기다리지 않고 바로 이 순서로 다시 그립니다 (서버에 요청한 정렬과 같은 규칙).
 */
export function orderCommon(questions: readonly CommonQuestion[]): CommonQuestion[] {
  const favorites = questions
    .filter((question) => question.favorite)
    .sort((a, b) => (b.favoritedAt ?? '').localeCompare(a.favoritedAt ?? ''))
  return [...favorites, ...questions.filter((question) => !question.favorite)]
}

/** 공통 질문 탭의 우측 요약. "즐겨찾기 N개 · 메모 N개" */
export function summarizeCommon(questions: readonly CommonQuestion[]) {
  return {
    favoriteCount: questions.filter((question) => question.favorite).length,
    memoCount: questions.filter((question) => question.memo !== null).length,
  }
}
