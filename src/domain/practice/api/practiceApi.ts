import { api } from '@/shared/api/apiClient'

import { ALL_FOLDERS, type PracticeListQuery } from '../types/practice'

import {
  toPracticeFolder,
  toPracticeFolders,
  toPracticeMoveResult,
  toPracticePage,
  type FolderListResponse,
  type FolderMoveResponse,
  type FolderResponse,
  type PracticeRecordFolderRequest,
  type PracticeRecordListResponse,
} from './practiceResponse'

import './practiceMock'

/**
 * 내 연습 기록 목록. `GET /api/practice-records?status=&folderId=&keyword=&page=&size=` — 최신순. (Cue-A/backend #92)
 * `VITE_REAL_APIS` 이름은 `practice-records` 입니다.
 *
 * - `folderId` 그 폴더의 세션만. 없으면 전체
 * - `status` `COMPLETED` · `IN_PROGRESS`. 없으면 둘 다. 중단한 세션(`ABORTED`)은 서버가 늘 빼고 보냅니다
 * - `keyword` 회사 이름 · 직무에서 찾습니다
 * - `size` 는 100 을 넘길 수 없습니다
 *
 * "폴더에 넣지 않은 기록만" 거르는 조건은 서버에 없습니다. 시안의 "기타" 카드는 두지 않기로 했습니다 (docs/90 Q17).
 */
export async function getPracticeSessions(query: PracticeListQuery) {
  const params = new URLSearchParams()
  if (query.folder !== ALL_FOLDERS) params.set('folderId', query.folder)
  if (query.status !== 'ALL') params.set('status', query.status)
  const keyword = query.keyword.trim()
  if (keyword) params.set('keyword', keyword)
  params.set('page', String(query.page))
  params.set('size', String(query.size))

  const response = await api.get<PracticeRecordListResponse>(`/api/practice-records?${params.toString()}`)
  return toPracticePage(response)
}

/**
 * 내 폴더 목록과 폴더별 세션 수. `GET /api/folders` — 만든 순서. (Cue-A/backend #97) `VITE_REAL_APIS` 이름은 `folders` 입니다.
 */
export async function getPracticeFolders() {
  const response = await api.get<FolderListResponse>('/api/folders')
  return toPracticeFolders(response)
}

/**
 * 폴더 만들기. `POST /api/folders` (본문 `{ folderName }`)
 *
 * 이름은 앞뒤 공백을 자른 뒤 1~50자이고, 비었거나 넘으면 `INVALID_REQUEST` 입니다. 내 폴더끼리 같은 이름이면
 * `FOLDER_NAME_DUPLICATED`, 이미 20개면 `FOLDER_LIMIT_EXCEEDED`(둘 다 409) 입니다. 화면도 이미 받은 목록으로 같은 이름을
 * 먼저 막지만(FolderNameDialog), 다른 탭에서 방금 만든 이름은 서버가 거절합니다.
 */
export async function createPracticeFolder(name: string) {
  const response = await api.post<FolderResponse>('/api/folders', { folderName: name })
  return toPracticeFolder(response)
}

/**
 * 폴더 이름 바꾸기. `PATCH /api/folders/{folderId}` (본문 `{ folderName }`)
 *
 * 이름 규칙 · 오류는 만들기와 같습니다. 지금 이름과 같으면 그대로 성공합니다. 없는 폴더 · 남의 폴더(다른 탭에서 지운
 * 경우 등)는 404 `FOLDER_NOT_FOUND` 입니다.
 */
export async function renamePracticeFolder(folderId: string, name: string) {
  const response = await api.patch<FolderResponse>(`/api/folders/${encodeURIComponent(folderId)}`, { folderName: name })
  return toPracticeFolder(response)
}

/**
 * 폴더 삭제. `DELETE /api/folders/{folderId}`
 *
 * 안의 세션은 지우지 않고 폴더에서만 빠집니다("전체" 에는 그대로 보입니다). 이미 지운 폴더는 404 `FOLDER_NOT_FOUND` 입니다.
 */
export async function deletePracticeFolder(folderId: string) {
  await api.delete<void>(`/api/folders/${encodeURIComponent(folderId)}`)
}

/**
 * 세션을 폴더로 옮깁니다. `PATCH /api/practice-records/folder` (본문 `{ sessionIds, folderId }`) — 이슈 #205
 * `VITE_REAL_APIS` 이름은 목록과 같은 `practice-records` 입니다.
 *
 * - `folderId` 가 null 이면 폴더에서 뺍니다
 * - **면접 단위로 옮깁니다.** 보낸 회차가 속한 면접의 1회차와 재면접이 다 같이 옮겨져서, 응답의 `movedSessionIds` 가
 *   보낸 것보다 많을 수 있습니다
 * - `sessionIds` 는 1~100개입니다. 화면은 지금 한 행씩만 보냅니다
 * - 하나라도 없거나 남의 것이거나 중단된 세션이면 아무것도 옮기지 않고 404 `SESSION_NOT_FOUND`, 폴더가 없거나 남의 것이면
 *   404 `FOLDER_NOT_FOUND` 입니다. 1분에 30번까지입니다
 */
export async function moveSessionsToFolder(sessionIds: string[], folderId: string | null) {
  const request: PracticeRecordFolderRequest = { sessionIds, folderId }
  const response = await api.patch<FolderMoveResponse>('/api/practice-records/folder', request)
  return toPracticeMoveResult(response)
}
