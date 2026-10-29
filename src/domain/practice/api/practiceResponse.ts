import type { PracticeFolder, PracticeFolders, PracticePage, PracticeSession } from '../types/practice'

/**
 * 연습 기록 서버 응답 모양입니다. **백엔드에 아직 없는 API 라 프론트가 정한 임시안입니다.**
 *
 * 필드는 백엔드 엔티티(`InterviewSession` · `Folder`)의 이름을 따랐습니다. 백엔드가 만들 때 그대로 쓰거나,
 * 바뀌면 이 파일과 변환 함수만 고치면 됩니다.
 */

/** `GET /api/interviews` 목록 한 줄 */
export type InterviewSessionSummaryResponse = {
  sessionId: string
  /** 회사 미선택(인재상 직접 입력)이면 null — `session.company_id` 가 nullable */
  companyName: string | null
  jobRole: string
  persona: 'FRIENDLY' | 'PRESSURE'
  /** 회차. 루트 세션(`retry_of_session_id` 가 null)이 1 입니다 */
  round: number
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED'
  questionCount: number
  createdAt: string
  completedAt: string | null
  folderId: string | null
  reportId: string | null
  totalScore: number | null
}

export type InterviewSessionListResponse = {
  sessions: InterviewSessionSummaryResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type FolderResponse = {
  folderId: string
  folderName: string
  sessionCount: number
  createdAt: string
}

/** `GET /api/folders` */
export type FolderListResponse = {
  totalSessionCount: number
  unfiledSessionCount: number
  folders: FolderResponse[]
}

export function toPracticeSession(response: InterviewSessionSummaryResponse): PracticeSession {
  return {
    sessionId: response.sessionId,
    companyName: response.companyName,
    jobRole: response.jobRole,
    persona: response.persona,
    round: response.round,
    status: response.status,
    questionCount: response.questionCount,
    startedAt: response.createdAt,
    reportId: response.reportId,
    totalScore: response.totalScore,
  }
}

export function toPracticePage(response: InterviewSessionListResponse): PracticePage {
  return {
    sessions: response.sessions.map(toPracticeSession),
    page: response.page,
    size: response.size,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  }
}

export function toPracticeFolder(response: FolderResponse): PracticeFolder {
  return { folderId: response.folderId, name: response.folderName, sessionCount: response.sessionCount }
}

export function toPracticeFolders(response: FolderListResponse): PracticeFolders {
  return {
    totalCount: response.totalSessionCount,
    unfiledCount: response.unfiledSessionCount,
    folders: response.folders.map(toPracticeFolder),
  }
}
