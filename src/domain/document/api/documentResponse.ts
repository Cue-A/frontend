import type {
  DocumentDetail,
  DocumentPage,
  DocumentSourceType,
  DocumentSummary,
  DocumentType,
} from '../types/document'

/**
 * 문서 API 의 서버 응답 모양입니다. (Cue-A/backend `feat/28-document-upload` ·
 * `feat/30-document-query` 의 `DocumentResponse` · `DocumentListResponse` ·
 * `DocumentDetailResponse` 기준)
 *
 * `indexStatus` · `indexedAt` · `indexError` 는 백엔드에서 빠졌습니다 (Cue-A/backend#58). 타입에 남겨 두면
 * 실제 응답에는 없는 값을 화면이 읽다가 깨집니다 (`STATUS_VIEW[undefined]`).
 *
 * 지금은 화면 타입과 필드가 같습니다. 그래도 변환을 거치는 이유는, 서버 필드가
 * 바뀌었을 때 고칠 자리를 이 파일 하나로 묶어두기 위해서입니다.
 */
export type DocumentResponse = {
  documentId: string
  documentType: DocumentType
  sourceType: DocumentSourceType
  title: string
  fileName: string | null
  fileSize: number | null
  createdAt: string
}

export type DocumentListResponse = {
  documents: DocumentResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type DocumentDetailResponse = {
  documentId: string
  documentType: DocumentType
  sourceType: DocumentSourceType
  title: string
  content: string | null
  downloadUrl: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 문서 수정(`PATCH /api/documents/{documentId}`)의 응답에서 **화면이 읽는 부분**입니다.
 *
 * API 명세(Notion "문서 제목 수정")의 응답은 `{ documentId, title, updatedAt }` 입니다. 등록 응답
 * (`DocumentResponse`)과 달리 종류 · 파일명 · 등록일이 없어서 목록의 한 줄을 이 응답으로 갈아 끼울 수 없습니다.
 * 그래서 바뀐 제목만 읽고 목록은 다시 부릅니다.
 *
 * 명세 예시에 적혀 있는 `indexStatus` 는 **필요 없는 값으로 백엔드와 확인했습니다.** 다른 문서 응답에서도 이미
 * 빠졌습니다 (Cue-A/backend#58).
 */
export type DocumentUpdateResponse = {
  documentId: string
  title: string
}

export function toDocumentSummary(response: DocumentResponse): DocumentSummary {
  return {
    documentId: response.documentId,
    documentType: response.documentType,
    sourceType: response.sourceType,
    title: response.title,
    fileName: response.fileName,
    fileSize: response.fileSize,
    createdAt: response.createdAt,
  }
}

export function toDocumentPage(response: DocumentListResponse): DocumentPage {
  return {
    documents: response.documents.map(toDocumentSummary),
    page: response.page,
    size: response.size,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  }
}

export function toDocumentDetail(response: DocumentDetailResponse): DocumentDetail {
  return {
    documentId: response.documentId,
    documentType: response.documentType,
    sourceType: response.sourceType,
    title: response.title,
    content: response.content,
    downloadUrl: response.downloadUrl,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  }
}
