import type { PracticeFolder, PracticeFolders, PracticePage, PracticeReportStatus, PracticeSession } from '../types/practice'

/**
 * 연습 기록 서버 응답 모양입니다. (Cue-A/backend #92 `PracticeRecordListResponse` · #97 `FolderListResponse`)
 *
 * 화면 타입(`types/practice.ts`)과 따로 둡니다. 서버 필드가 바뀌면 이 파일과 변환 함수만 고칩니다.
 */

/** `GET /api/practice-records` 목록 한 줄 */
export type PracticeRecordResponse = {
  sessionId: string
  /** 회사를 고르지 않았으면 null */
  companyName: string | null
  jobRole: string
  persona: 'FRIENDLY' | 'PRESSURE'
  /** 고른 문항 수. 되묻기는 세지 않습니다 */
  questionCount: number
  /** 서버 enum 에는 `ABORTED` 도 있지만, 중단된 세션은 목록에서 빼고 보냅니다 */
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED'
  /** 회차. 1부터이고 중단된 재면접은 세지 않습니다 */
  round: number
  createdAt: string
  /** 들어 있는 폴더. 폴더에 넣지 않았으면 null */
  folder: { folderId: string; folderName: string } | null
  /** 리포트 요약. 리포트를 요청하지 않았으면 null */
  report: { reportId: string; status: PracticeReportStatus; scoreTotal: number | null } | null
}

export type PracticeRecordListResponse = {
  records: PracticeRecordResponse[]
  /** 0 부터 */
  page: number
  size: number
  /** 필터를 적용한 전체 개수 */
  totalElements: number
  totalPages: number
}

export type FolderResponse = {
  folderId: string
  folderName: string
  /** 이 폴더의 세션 수. 회차마다 하나로 세고 중단된 세션은 세지 않습니다 */
  sessionCount: number
  createdAt: string
}

/** `GET /api/folders` */
export type FolderListResponse = {
  /** 「전체」 카드의 세션 수. 연습 기록 목록을 필터 없이 불렀을 때의 `totalElements` 와 같습니다 */
  totalCount: number
  /** 만든 순서(오래된 것부터). 폴더가 없으면 빈 배열 */
  folders: FolderResponse[]
}

/** 리포트 화면이 그릴 수 있는 상태입니다. 분석 중 · 실패한 리포트는 분석 중 화면이 맡습니다 */
function isReadyReport(status: PracticeReportStatus) {
  return status === 'COMPLETED' || status === 'PARTIAL'
}

export function toPracticeSession(response: PracticeRecordResponse): PracticeSession {
  const report = response.report
  const ready = report !== null && isReadyReport(report.status)
  return {
    sessionId: response.sessionId,
    companyName: response.companyName,
    jobRole: response.jobRole,
    persona: response.persona,
    round: response.round,
    status: response.status,
    questionCount: response.questionCount,
    startedAt: response.createdAt,
    reportStatus: report?.status ?? null,
    reportId: ready ? report.reportId : null,
    totalScore: ready ? (report.scoreTotal ?? null) : null,
  }
}

export function toPracticePage(response: PracticeRecordListResponse): PracticePage {
  return {
    sessions: response.records.map(toPracticeSession),
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
    totalCount: response.totalCount,
    folders: response.folders.map(toPracticeFolder),
  }
}
