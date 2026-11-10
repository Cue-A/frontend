/**
 * 내 보관함 > 연습 기록 화면 타입입니다.
 *
 * 서버 응답 모양은 `api/practiceResponse.ts` 에 따로 있습니다 — 서버 필드가 바뀌어도 화면이 흔들리지 않게
 * 변환을 한 겹 둡니다 (docs/01-conventions.md "타입").
 */

/**
 * 세션 상태. 백엔드 `SessionStatus` 와 같은 세 값입니다.
 * - `IN_PROGRESS` 시작했지만 끝내지 않은 면접
 * - `COMPLETED` 끝까지 본 면접. 리포트를 만들 수 있습니다
 * - `ABORTED` 중간에 그만둔 면접. 리포트를 만들지 않습니다. 연습 기록 목록은 서버가 이 세션을 빼고 보내서 화면에 나오지 않습니다
 */
export type PracticeStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED'

/**
 * 리포트 상태. 백엔드 `ReportStatus` 와 같은 네 값입니다.
 * - `PROCESSING` 분석 중
 * - `COMPLETED` · `PARTIAL` 리포트를 볼 수 있습니다. `PARTIAL` 은 일부 축이 실패한 리포트입니다
 * - `FAILED` 분석이 실패했습니다
 */
export type PracticeReportStatus = 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'

/** 면접관 스타일. 기능명세서 INT-2 의 두 종입니다 (시안의 "중립적 면접관" 은 명세서에 없어 뺐습니다) */
export type PracticePersona = 'FRIENDLY' | 'PRESSURE'

/** 목록 한 줄 */
export type PracticeSession = {
  sessionId: string
  /** 기업을 고르지 않고 인재상을 직접 적었으면 null */
  companyName: string | null
  jobRole: string
  persona: PracticePersona
  /** 같은 면접을 몇 번째 다시 봤는지. 처음 본 면접이 1 입니다 */
  round: number
  status: PracticeStatus
  /** 고른 문항 수(3 · 6 · 9) */
  questionCount: number
  /** ISO 8601. 면접을 시작한 시각입니다 */
  startedAt: string
  /** 리포트 상태. 끝냈지만 분석을 아직 안 맡겼으면 null 입니다 */
  reportStatus: PracticeReportStatus | null
  /** 볼 수 있는 리포트(`COMPLETED` · `PARTIAL`)의 id. 분석 중 · 실패 · 미요청이면 null 입니다 */
  reportId: string | null
  /** 리포트의 종합 점수. 볼 수 있는 리포트가 아니면 null 입니다 */
  totalScore: number | null
  /** 들어 있는 폴더. 폴더에 넣지 않았으면 null 입니다 */
  folder: PracticeSessionFolder | null
}

/** 세션이 들어 있는 폴더. 목록 응답에 이름까지 같이 옵니다 */
export type PracticeSessionFolder = {
  folderId: string
  name: string
}

export type PracticePage = {
  /** 최신순입니다 */
  sessions: PracticeSession[]
  /** 0 부터 */
  page: number
  size: number
  /** 거른 뒤의 전체 개수 */
  totalElements: number
  totalPages: number
}

export type PracticeFolder = {
  folderId: string
  name: string
  sessionCount: number
}

export type PracticeFolders = {
  /** 내 세션 전부(중단한 세션 제외). "전체" 카드의 숫자입니다 */
  totalCount: number
  /** 만든 순서입니다 */
  folders: PracticeFolder[]
}

/** 폴더로 옮긴 결과 */
export type PracticeMoveResult = {
  /** 옮긴 폴더. 폴더에서 뺐으면 null */
  folderId: string | null
  /** 같이 옮겨진 회차까지 센 수. 재면접이 있으면 1 보다 큽니다 */
  movedCount: number
}

/** 폴더 카드에서 고른 것. 폴더 id 는 UUID 라 상수와 겹치지 않습니다 */
export type FolderSelection = typeof ALL_FOLDERS | string

/** "전체" 카드 */
export const ALL_FOLDERS = 'ALL'

/** 상태 탭. 중단한 세션은 서버가 빼고 보내서 어느 탭에도 없습니다 */
export type PracticeStatusTab = 'ALL' | 'COMPLETED' | 'IN_PROGRESS'

export type PracticeListQuery = {
  folder: FolderSelection
  status: PracticeStatusTab
  /** 기업 이름 · 직무에서 찾습니다. 비우면 거르지 않습니다 */
  keyword: string
  /** 0 부터 */
  page: number
  size: number
}
