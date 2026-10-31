import { api } from '@/shared/api/apiClient'

import type { QuestionListQuery } from '../types/question'

import { toQuestionPage, type QuestionListResponse } from './questionResponse'

import './questionMock'

/**
 * 질문 목록. `GET /api/questions?tab=&keyword=&page=&size=` — 최신순.
 *
 * **백엔드에 없는 API 입니다.** 경로 · 쿼리 · 응답 모양 모두 프론트 임시안이고 목업(`missingInBackend`)이 답합니다
 * (이슈 #138). 질문은 면접마다 쌓이기만 해서 문서(20개 상한)처럼 한 번에 다 받을 수 없습니다. 그래서 탭 · 검색 ·
 * 쪽 나누기를 서버에 맡기는 모양으로 정했습니다.
 *
 * - `tab` `ALL` 전체 · `COMMON` 공통 질문만 · `BOOKMARKED` 내가 북마크한 질문만
 * - `keyword` 질문 문장에서 찾습니다
 *
 * TODO(백엔드): 백엔드가 만들면 `questionMock.ts` 의 `missingInBackend` 를 지우고, 응답이 다르면 `questionResponse.ts`
 * 의 변환 함수를 고칩니다. 경로의 도메인 조각(`questions`)이 바뀌면 `VITE_REAL_APIS` 에 넣는 이름도 같이 바뀝니다
 * (shared/api/mock.ts `isRealApi`).
 */
export async function getQuestions(query: QuestionListQuery) {
  const params = new URLSearchParams()
  params.set('tab', query.tab)
  const keyword = query.keyword.trim()
  if (keyword) params.set('keyword', keyword)
  params.set('page', String(query.page))
  params.set('size', String(query.size))

  const response = await api.get<QuestionListResponse>(`/api/questions?${params.toString()}`)
  return toQuestionPage(response)
}

/**
 * 북마크 등록. `PUT /api/questions/{questionId}/bookmark`
 *
 * **백엔드에 없는 API 입니다.** 이미 북마크한 질문에 다시 보내도 성공합니다(같은 요청을 몇 번 보내도 결과가 같음).
 * TODO(백엔드): ERD 의 `bookmarked_question` 은 `(question_id, session_id)` 로 질문을 가리킵니다 (questionResponse.ts)
 */
export function addQuestionBookmark(questionId: string) {
  return api.put<void>(`/api/questions/${encodeURIComponent(questionId)}/bookmark`)
}

/**
 * 북마크 해제. `DELETE /api/questions/{questionId}/bookmark`
 *
 * **백엔드에 없는 API 입니다.** 북마크하지 않은 질문에 보내도 성공합니다.
 */
export function removeQuestionBookmark(questionId: string) {
  return api.delete<void>(`/api/questions/${encodeURIComponent(questionId)}/bookmark`)
}
