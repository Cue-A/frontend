import type { PracticeFolder, PracticeFolders, PracticePage, PracticeSession } from '../types/practice'

/**
 * 연습 기록 서버 응답 모양입니다. **백엔드에 아직 없는 API 라 프론트가 정한 임시안입니다.**
 *
 * 필드는 백엔드 엔티티(`InterviewSession` · `Folder`)의 이름을 따랐습니다. 백엔드가 만들 때 그대로 쓰거나,
 * 바뀌면 이 파일과 변환 함수만 고치면 됩니다.
 *
 * **세션 테이블에 그대로 있지 않은 값**은 백엔드가 계산해서 내려줘야 합니다. 요청할 때 이 셋을 따로 적습니다.
 * - `round` — `retry_of_session_id` 를 거슬러 올라가 센 회차
 * - `reportId` · `totalScore` — 그 세션의 리포트를 붙여서(join) 꺼낸 값
 *
 * 화면이 쓰지 않는 값(끝난 시각 등)은 넣지 않았습니다. 필요해지면 그때 더합니다.
 */

/** `GET /api/interviews` 목록 한 줄 */
export type InterviewSessionSummaryResponse = {
  sessionId: string
  /** 회사 미선택(인재상 직접 입력)이면 null — `session.company_id` 가 nullable */
  companyName: string | null
  jobRole: string
  persona: 'FRIENDLY' | 'PRESSURE'
  /** 회차. 루트 세션(`retry_of_session_id` 가 null)이 1 입니다. **백엔드 계산 값** */
  round: number
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED'
  questionCount: number
  createdAt: string
  folderId: string | null
  /** 리포트를 등록하지 않았으면 null. **리포트 조인 값** */
  reportId: string | null
  /** 리포트 종합 점수. 분석이 안 끝났거나 실패했으면 null. **리포트 조인 값** */
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
