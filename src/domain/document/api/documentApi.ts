import { api } from '@/shared/api/apiClient'

import type { CreateDocumentInput, DocumentListQuery } from '../types/document'

import {
  toDocumentDetail,
  toDocumentPage,
  toDocumentSummary,
  type DocumentDetailResponse,
  type DocumentListResponse,
  type DocumentResponse,
} from './documentResponse'

import './documentMock'

/**
 * 백엔드는 확장자와 MIME 이 **같은 형식을 가리키는지**까지 봅니다 (`FileValidator`).
 *
 * 그런데 브라우저가 `File.type` 을 비워두는 경우가 있습니다 — OS 에 그 확장자가
 * 등록돼 있지 않으면 그렇습니다(워드가 없는 PC 의 `.docx` 가 대표적입니다). 빈 채로
 * 보내면 multipart 조각이 `application/octet-stream` 으로 나가서, 멀쩡한 파일이
 * "확장자와 MIME 타입이 맞지 않습니다" 로 거절됩니다.
 *
 * 그래서 **비어 있을 때만** 확장자로 채웁니다. 값이 있는데 틀린 경우는 건드리지 않습니다 —
 * 그건 확장자를 바꿔 붙인 파일일 수 있고, 거절하는 게 맞습니다.
 */
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
}

function withMimeType(file: File): File {
  if (file.type) return file

  const dot = file.name.lastIndexOf('.')
  const mimeType = dot < 0 ? undefined : MIME_BY_EXTENSION[file.name.slice(dot + 1).toLowerCase()]
  if (!mimeType) return file

  return new File([file], file.name, { type: mimeType, lastModified: file.lastModified })
}

function toCreateForm(input: CreateDocumentInput): FormData {
  const form = new FormData()
  form.append('sourceType', input.sourceType)
  form.append('title', input.title)

  // 안 보내면 백엔드가 RESUME 으로 둡니다. 빈 문자열을 보내면 enum 변환이 깨지므로 아예 뺍니다.
  if (input.documentType) {
    form.append('documentType', input.documentType)
  }

  if (input.sourceType === 'FILE') {
    const file = withMimeType(input.file)
    // 세 번째 인자를 주지 않으면 이름이 "blob" 으로 나갈 수 있습니다. 서버는 이 이름의 확장자로 형식을 봅니다.
    form.append('file', file, file.name)
  } else {
    form.append('content', input.content)
  }

  return form
}

/**
 * 문서 등록. `POST /api/documents` (multipart/form-data, 201)
 *
 * 파일 업로드와 직접 작성이 같은 엔드포인트입니다. 자소서 업로드는 원래 3단계
 * (presigned 발급 → S3 PUT → 확정)였지만 백엔드가 한 번으로 합쳤습니다 (Cue-A/backend#28).
 *
 * 걸리는 제한 — 전부 서버가 다시 봅니다.
 * - 파일: pdf · docx · txt, 10MB, 빈 파일 거부
 * - 직접 작성: 20,000자
 * - 제목: 필수, 100자
 * - 사용자당 20개 (`DOCUMENT_LIMIT_EXCEEDED`) — 삭제 API 가 아직 없어 재시도로 풀리지 않습니다
 * - 분당 20회 (`RATE_LIMIT_EXCEEDED`)
 */
export async function createDocument(input: CreateDocumentInput) {
  const response = await api.postForm<DocumentResponse>('/api/documents', toCreateForm(input))
  return toDocumentSummary(response)
}

/**
 * 문서 목록. `GET /api/documents` — 본인 문서만, 최신순.
 *
 * 비어 있어도 200 입니다(`documents: []`). 204 를 기대하고 분기하지 마세요.
 */
export async function getDocuments(query: DocumentListQuery = {}) {
  const params = new URLSearchParams()
  if (query.documentType) params.set('documentType', query.documentType)
  if (query.page !== undefined) params.set('page', String(query.page))
  if (query.size !== undefined) params.set('size', String(query.size))

  const search = params.toString()
  const response = await api.get<DocumentListResponse>(`/api/documents${search ? `?${search}` : ''}`)
  return toDocumentPage(response)
}

/**
 * 문서 상세. `GET /api/documents/{documentId}`
 *
 * 없는 문서와 남의 문서가 똑같이 `DOCUMENT_NOT_FOUND`(404) 입니다 — 존재 여부를 숨기려고
 * 백엔드가 일부러 403 을 쓰지 않습니다. UUID 가 아닌 값도 같은 코드입니다.
 *
 * `downloadUrl` 은 부를 때마다 새로 만들어지고 1시간 뒤 만료됩니다. 받아서 저장해두지 말고
 * 열 때마다 부르세요.
 */
export async function getDocument(documentId: string) {
  const response = await api.get<DocumentDetailResponse>(`/api/documents/${encodeURIComponent(documentId)}`)
  return toDocumentDetail(response)
}
