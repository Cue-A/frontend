/**
 * 문서(자기소개서 · 포트폴리오) 화면 타입입니다. (이슈 #54 1절)
 *
 * 보관함(C-02)이 올리고, 옵션 설정(A-05)이 고릅니다. 두 화면이 같은 타입을 씁니다.
 * 서버 응답 모양은 `api/documentResponse.ts` 에 따로 있습니다 — 서버 필드가 바뀌어도
 * 화면이 흔들리지 않게 변환을 한 겹 둡니다 (docs/01-conventions.md "타입").
 */

/**
 * 문서 종류. 초안에 있던 `PRESENTATION` · `SCRIPT` 는 백엔드에서 빠졌습니다.
 * 면접 동작에는 쓰이지 않고 목록을 거르는 데만 씁니다.
 */
export type DocumentType = 'RESUME' | 'PORTFOLIO'

/** 파일로 올렸는지(`FILE`), 화면에서 직접 썼는지(`MARKDOWN`). */
export type DocumentSourceType = 'FILE' | 'MARKDOWN'

/**
 * 이 문서로 면접을 시작할 수 있는지.
 *
 * - `PROCESSING` 처음 올린 문서를 준비하는 중
 * - `COMPLETED` 면접 시작 가능
 * - `OUTDATED` 쓰던 문서를 고쳐서 다시 준비하는 중. `PROCESSING` 과 문구가 달라야
 *   합니다 — 멀쩡히 쓰던 문서가 갑자기 막히면 사용자는 이유를 모릅니다
 * - `FAILED` 되돌릴 수 없는 실패. 다시 올리게 안내합니다
 *
 * **지금은 `COMPLETED` 만 옵니다.** 인덱싱이 이번 범위에서 빠져서 백엔드가 등록 즉시
 * 준비 완료로 둡니다. 나머지 셋은 인덱싱이 붙는 날 백엔드 한 줄로 내려오기 시작하므로
 * 화면 분기는 미리 만들어 둡니다. (이슈 #54 1-3)
 */
export type DocumentIndexStatus = 'PROCESSING' | 'COMPLETED' | 'OUTDATED' | 'FAILED'

/** 목록 한 줄. 등록 응답도 같은 모양이라 올린 뒤 목록에 그대로 끼워 넣을 수 있습니다. */
export type DocumentSummary = {
  /** UUID 문자열. 세션 생성에 `documentPublicId` 로 그대로 싣습니다. */
  documentId: string
  documentType: DocumentType
  sourceType: DocumentSourceType
  title: string
  /** 원본 파일명. `MARKDOWN` 문서면 null 입니다 (키는 항상 있습니다). */
  fileName: string | null
  /** 바이트. `MARKDOWN` 문서면 null 입니다. */
  fileSize: number | null
  indexStatus: DocumentIndexStatus
  /** ISO 8601 (`2026-09-23T10:11:12+09:00`) */
  createdAt: string
}

export type DocumentPage = {
  /** 최신순입니다. */
  documents: DocumentSummary[]
  /** 0 부터 */
  page: number
  size: number
  /** 필터를 적용한 전체 개수 */
  totalElements: number
  totalPages: number
}

/**
 * 문서 상세. 본문을 얻는 방법이 `sourceType` 에 따라 갈리고, **둘 중 하나는 항상 null** 입니다.
 */
export type DocumentDetail = {
  documentId: string
  documentType: DocumentType
  sourceType: DocumentSourceType
  title: string
  /** `MARKDOWN` 본문. `FILE` 이면 null */
  content: string | null
  /** `FILE` 원본을 받을 주소. 조회할 때마다 새로 만들어지고 **1시간 뒤 만료**됩니다. `MARKDOWN` 이면 null */
  downloadUrl: string | null
  indexStatus: DocumentIndexStatus
  createdAt: string
  updatedAt: string
}

export type DocumentListQuery = {
  /** 없으면 전체 */
  documentType?: DocumentType
  /** 0 부터. 기본 0 */
  page?: number
  /** 기본 20, 최대 100. 사용자당 문서가 20개까지라 기본값이면 한 페이지에 다 옵니다. */
  size?: number
}

/**
 * 문서 등록 입력. `sourceType` 에 따라 `file` 또는 `content` 중 하나만 있습니다.
 *
 * `documentType` 은 선택입니다. 안 보내면 백엔드가 `RESUME` 으로 둡니다.
 * 수정 · 삭제 API 가 아직 없어 잘못 고르면 되돌릴 수 없으니, 화면에 종류 선택이
 * 없으면 비워서 보냅니다.
 */
export type CreateDocumentInput =
  | { sourceType: 'FILE'; title: string; file: File; documentType?: DocumentType }
  | { sourceType: 'MARKDOWN'; title: string; content: string; documentType?: DocumentType }
