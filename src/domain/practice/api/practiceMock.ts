import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type {
  FolderListResponse,
  FolderResponse,
  InterviewSessionListResponse,
  InterviewSessionSummaryResponse,
} from './practiceResponse'

/**
 * 연습 기록 목업입니다. **백엔드에 세션 목록 · 폴더 API 가 없어서** `interviews` · `folders` 를 `VITE_REAL_APIS` 에
 * 넣어도 이 API 들은 목업이 답합니다.
 *
 * 숫자는 시안(전체 12 · 삼성전자 5 · 카카오 4 · 네이버 3 · 기타 0)에 맞췄습니다. 날짜는 홈 목업처럼 **오늘 기준**으로
 * 만듭니다 — 날짜를 박아 두면 "진행 중" 세션이 몇 달 전 것으로 보입니다.
 *
 * 저장은 메모리에만 합니다. 새로 만든 폴더는 새로고침하면 사라집니다.
 */

const MAX_FOLDER_NAME_LENGTH = 50
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

type StoredFolder = { folderId: string; folderName: string; createdAt: string }
type StoredSession = Omit<InterviewSessionSummaryResponse, 'createdAt' | 'completedAt'> & { daysAgo: number }

const FOLDER_SAMSUNG = '6f1c2a40-1b7e-4b8e-9a31-5d0c2e7a9b01'
const FOLDER_KAKAO = '6f1c2a40-1b7e-4b8e-9a31-5d0c2e7a9b02'
const FOLDER_NAVER = '6f1c2a40-1b7e-4b8e-9a31-5d0c2e7a9b03'

const folders: StoredFolder[] = [
  { folderId: FOLDER_SAMSUNG, folderName: '삼성전자', createdAt: '2026-07-01T10:00:00+09:00' },
  { folderId: FOLDER_KAKAO, folderName: '카카오', createdAt: '2026-07-02T10:00:00+09:00' },
  { folderId: FOLDER_NAVER, folderName: '네이버', createdAt: '2026-07-03T10:00:00+09:00' },
]

function session(
  index: number,
  fields: Omit<StoredSession, 'sessionId' | 'reportId'> & { hasReport?: boolean },
): StoredSession {
  const { hasReport = fields.status === 'COMPLETED', ...rest } = fields
  const id = String(index).padStart(2, '0')
  return { ...rest, sessionId: `mock-practice-${id}`, reportId: hasReport ? `mock-practice-report-${id}` : null }
}

/** 최신순으로 적었습니다. `daysAgo` 는 오늘로부터 며칠 전에 시작했는지입니다 */
const sessions: StoredSession[] = [
  session(1, { companyName: '삼성전자', jobRole: '마케팅 직무', persona: 'PRESSURE', round: 1, status: 'COMPLETED', questionCount: 9, totalScore: 84, folderId: FOLDER_SAMSUNG, daysAgo: 1 }),
  session(2, { companyName: '카카오', jobRole: '백엔드 개발자', persona: 'FRIENDLY', round: 1, status: 'COMPLETED', questionCount: 6, totalScore: 76, folderId: FOLDER_KAKAO, daysAgo: 3 }),
  session(3, { companyName: '삼성전자', jobRole: '프론트엔드 개발자', persona: 'FRIENDLY', round: 2, status: 'IN_PROGRESS', questionCount: 6, totalScore: null, folderId: FOLDER_SAMSUNG, daysAgo: 4 }),
  session(4, { companyName: '네이버', jobRole: '데이터 분석가', persona: 'FRIENDLY', round: 1, status: 'COMPLETED', questionCount: 9, totalScore: 88, folderId: FOLDER_NAVER, daysAgo: 6 }),
  // 끝냈지만 분석 화면에서 나가 리포트를 맡기지 않은 세션입니다. "분석하기" 를 확인할 때 씁니다
  session(5, { companyName: '카카오', jobRole: '백엔드 개발자', persona: 'PRESSURE', round: 2, status: 'COMPLETED', questionCount: 6, totalScore: null, folderId: FOLDER_KAKAO, daysAgo: 8, hasReport: false }),
  session(6, { companyName: '삼성전자', jobRole: '프론트엔드 개발자', persona: 'FRIENDLY', round: 1, status: 'COMPLETED', questionCount: 6, totalScore: 71, folderId: FOLDER_SAMSUNG, daysAgo: 11 }),
  // 중간에 그만둔 세션은 "전체" 탭에서만 보입니다
  session(7, { companyName: '네이버', jobRole: '서비스 기획자', persona: 'PRESSURE', round: 1, status: 'ABORTED', questionCount: 6, totalScore: null, folderId: FOLDER_NAVER, daysAgo: 13 }),
  session(8, { companyName: '카카오', jobRole: '프론트엔드 개발자', persona: 'FRIENDLY', round: 1, status: 'COMPLETED', questionCount: 3, totalScore: 69, folderId: FOLDER_KAKAO, daysAgo: 16 }),
  session(9, { companyName: '삼성전자', jobRole: '마케팅 직무', persona: 'FRIENDLY', round: 1, status: 'COMPLETED', questionCount: 6, totalScore: 79, folderId: FOLDER_SAMSUNG, daysAgo: 20 }),
  session(10, { companyName: '네이버', jobRole: '데이터 분석가', persona: 'PRESSURE', round: 1, status: 'COMPLETED', questionCount: 6, totalScore: 74, folderId: FOLDER_NAVER, daysAgo: 24 }),
  session(11, { companyName: '카카오', jobRole: '백엔드 개발자', persona: 'FRIENDLY', round: 1, status: 'COMPLETED', questionCount: 9, totalScore: 81, folderId: FOLDER_KAKAO, daysAgo: 29 }),
  session(12, { companyName: '삼성전자', jobRole: '프론트엔드 개발자', persona: 'PRESSURE', round: 1, status: 'COMPLETED', questionCount: 9, totalScore: 66, folderId: FOLDER_SAMSUNG, daysAgo: 35 }),
]

/** 오늘에서 `daysAgo` 일 전 오후 3시. 같은 날 여러 번 불러도 값이 같습니다 */
function startedAt(daysAgo: number): string {
  const date = new Date()
  date.setHours(15, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function toResponse({ daysAgo, ...stored }: StoredSession): InterviewSessionSummaryResponse {
  const createdAt = startedAt(daysAgo)
  // 질문 수 × 약 2분 뒤에 끝났다고 둡니다. 목록 화면은 쓰지 않는 값입니다
  const completedAt =
    stored.status === 'COMPLETED'
      ? new Date(new Date(createdAt).getTime() + stored.questionCount * 2 * 60_000).toISOString()
      : null
  return { ...stored, createdAt, completedAt }
}

function parsePositiveInt(value: string | null): number | null {
  if (value === null || value === '') return null
  const number = Number(value)
  if (!Number.isInteger(number)) throw new ApiError('INVALID_REQUEST', `숫자가 아닙니다 (${value})`)
  return number
}

function matchesKeyword(stored: StoredSession, keyword: string) {
  return [stored.companyName ?? '', stored.jobRole].some((text) => text.toLowerCase().includes(keyword))
}

const MISSING = '연습 기록 API 없음 — 세션 목록 · 폴더 컨트롤러가 백엔드에 없음 (경로 · 응답 모양 프론트 임시안)'

registerMock(
  'GET',
  '/api/interviews',
  (_params, _body, query): InterviewSessionListResponse => {
    const folderId = query.get('folderId')
    const unfiled = query.get('unfiled') === 'true'
    const status = query.get('status')
    const keyword = (query.get('keyword') ?? '').trim().toLowerCase()

    if (status !== null && status !== 'COMPLETED' && status !== 'IN_PROGRESS' && status !== 'ABORTED') {
      throw new ApiError('INVALID_REQUEST', `알 수 없는 상태입니다 (${status})`)
    }

    const pageParam = parsePositiveInt(query.get('page'))
    const sizeParam = parsePositiveInt(query.get('size'))
    // 문서 목록(DocumentQueryService)과 같은 보정입니다. 범위를 벗어나도 거절하지 않고 맞춥니다.
    const page = pageParam === null || pageParam < 0 ? 0 : pageParam
    const size = sizeParam === null || sizeParam < 1 ? DEFAULT_PAGE_SIZE : Math.min(sizeParam, MAX_PAGE_SIZE)

    const filtered = sessions
      .filter((stored) => {
        if (unfiled && stored.folderId !== null) return false
        if (folderId && stored.folderId !== folderId) return false
        if (status && stored.status !== status) return false
        return !keyword || matchesKeyword(stored, keyword)
      })
      .sort((a, b) => a.daysAgo - b.daysAgo)

    return {
      sessions: filtered.slice(page * size, page * size + size).map(toResponse),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    }
  },
  { missingInBackend: MISSING },
)

function countIn(folderId: string | null) {
  return sessions.filter((stored) => stored.folderId === folderId).length
}

function toFolderResponse(folder: StoredFolder): FolderResponse {
  return { ...folder, sessionCount: countIn(folder.folderId) }
}

registerMock(
  'GET',
  '/api/folders',
  (): FolderListResponse => ({
    totalSessionCount: sessions.length,
    unfiledSessionCount: countIn(null),
    folders: folders.map(toFolderResponse),
  }),
  { missingInBackend: MISSING },
)

registerMock(
  'POST',
  '/api/folders',
  (_params, body): FolderResponse => {
    const raw = typeof body === 'object' && body !== null ? (body as { folderName?: unknown }).folderName : undefined
    const folderName = typeof raw === 'string' ? raw.trim() : ''
    if (!folderName || folderName.length > MAX_FOLDER_NAME_LENGTH) {
      throw new ApiError('INVALID_REQUEST', `폴더 이름은 1~${MAX_FOLDER_NAME_LENGTH}자입니다`)
    }

    const folder: StoredFolder = { folderId: crypto.randomUUID(), folderName, createdAt: new Date().toISOString() }
    folders.push(folder)
    return toFolderResponse(folder)
  },
  { missingInBackend: MISSING },
)
