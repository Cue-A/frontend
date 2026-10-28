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
