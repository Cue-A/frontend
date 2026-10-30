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
 * - `ABORTED` 중간에 그만둔 면접. 리포트를 만들지 않습니다
 */
export type PracticeStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED'

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
  /** 리포트를 등록했으면 그 id. 끝냈지만 분석을 아직 안 맡겼으면 null 입니다 */
  reportId: string | null
  /** 리포트의 종합 점수. 분석이 안 끝났거나 실패했으면 null 입니다 */
  totalScore: number | null
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
  /** 내 세션 전부. "전체" 카드의 숫자입니다 */
  totalCount: number
  /** 폴더에 넣지 않은 세션. "기타" 카드의 숫자입니다 */
  unfiledCount: number
  /** 만든 순서입니다 */
  folders: PracticeFolder[]
}

/** 폴더 카드에서 고른 것. 폴더 id 는 UUID 라 두 상수와 겹치지 않습니다 */
export type FolderSelection = typeof ALL_FOLDERS | typeof UNFILED | string

/** "전체" 카드 */
export const ALL_FOLDERS = 'ALL'
/** "기타" 카드 — 폴더에 넣지 않은 세션 */
export const UNFILED = 'UNFILED'

/** 상태 탭. 중단한 세션은 "전체" 에서만 보입니다 */
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
