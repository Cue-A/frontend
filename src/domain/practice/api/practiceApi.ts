import { api } from '@/shared/api/apiClient'

import { ALL_FOLDERS, UNFILED, type PracticeListQuery } from '../types/practice'

import {
  toPracticeFolder,
  toPracticeFolders,
  toPracticePage,
  type FolderListResponse,
  type FolderResponse,
  type InterviewSessionListResponse,
} from './practiceResponse'

import './practiceMock'

/**
 * 내 면접 세션 목록. `GET /api/interviews?folderId=&unfiled=&status=&keyword=&page=&size=` — 최신순.
 *
 * **백엔드에 없는 API 입니다.** 경로 · 쿼리 · 응답 모양 모두 프론트 임시안이고 목업(`missingInBackend`)이 답합니다.
 * 세션은 쌓이기만 해서 문서(20개 상한)처럼 한 번에 다 받을 수 없습니다. 그래서 폴더 · 상태 · 검색 · 쪽 나누기를
 * 서버에 맡기는 모양으로 정했습니다.
 *
 * - `folderId` 그 폴더의 세션만. `unfiled=true` 면 폴더에 넣지 않은 세션만. 둘 다 없으면 전체
 * - `status` `COMPLETED` · `IN_PROGRESS`. 없으면 중단한 세션(`ABORTED`)까지 전부
 * - `keyword` 기업 이름 · 직무에서 찾습니다
 */
export async function getPracticeSessions(query: PracticeListQuery) {
  const params = new URLSearchParams()
  if (query.folder === UNFILED) params.set('unfiled', 'true')
  else if (query.folder !== ALL_FOLDERS) params.set('folderId', query.folder)
  if (query.status !== 'ALL') params.set('status', query.status)
  const keyword = query.keyword.trim()
  if (keyword) params.set('keyword', keyword)
  params.set('page', String(query.page))
  params.set('size', String(query.size))

  const response = await api.get<InterviewSessionListResponse>(`/api/interviews?${params.toString()}`)
  return toPracticePage(response)
}

/**
 * 내 폴더 목록과 폴더별 세션 수. `GET /api/folders`
 *
 * **백엔드에 없는 API 입니다.** 폴더 테이블(`folder`)과 세션의 `folder_id` 는 있지만 컨트롤러가 없습니다.
 */
export async function getPracticeFolders() {
  const response = await api.get<FolderListResponse>('/api/folders')
  return toPracticeFolders(response)
}

/**
 * 폴더 만들기. `POST /api/folders` (본문 `{ folderName }`)
 *
 * **백엔드에 없는 API 입니다.** 이름은 앞뒤 공백을 자른 뒤 1~50자(`folder.folder_name VARCHAR(50)`)이고, 비었거나
 * 넘으면 `INVALID_REQUEST` 로 봅니다. 같은 이름 막기는 지금 화면이 합니다 (FolderCreateDialog). 화면은 이미 받은
 * 목록과만 견줘서 다른 탭에서 방금 만든 이름은 못 막습니다 — 백엔드에 요청할 때 서버도 같은 이름을 거절해 달라고
 * 적습니다. (PR #128 리뷰)
 */
export async function createPracticeFolder(name: string) {
  const response = await api.post<FolderResponse>('/api/folders', { folderName: name })
  return toPracticeFolder(response)
}
