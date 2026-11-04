import { api } from '@/shared/api/apiClient'

import { ALL_FOLDERS, type PracticeListQuery } from '../types/practice'

import {
  toPracticeFolder,
  toPracticeFolders,
  toPracticePage,
  type FolderListResponse,
  type FolderResponse,
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
 * "폴더에 넣지 않은 기록만" 거르는 조건은 서버에 없어서, 시안의 "기타" 카드는 아직 두지 않습니다 (이슈 #167).
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
 * 먼저 막지만(FolderCreateDialog), 다른 탭에서 방금 만든 이름은 서버가 거절합니다.
 */
export async function createPracticeFolder(name: string) {
  const response = await api.post<FolderResponse>('/api/folders', { folderName: name })
  return toPracticeFolder(response)
}
