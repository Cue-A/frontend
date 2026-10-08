import { api } from '@/shared/api/apiClient'
import { isRealApi } from '@/shared/api/mock'

import type { CreateDocumentInput, DocumentListQuery } from '../types/document'

import {
  toDocumentDetail,
  toDocumentPage,
  toDocumentSummary,
  type DocumentDetailResponse,
  type DocumentListResponse,
  type DocumentResponse,
  type DocumentUpdateResponse,
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
 * - 사용자당 20개 (`DOCUMENT_LIMIT_EXCEEDED`) — 재시도로는 풀리지 않고, 문서를 지워야 자리가 납니다
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

/**
 * 문서 삭제. `DELETE /api/documents/{documentId}` (Cue-A/backend#40)
 *
 * 백엔드는 행을 지우지 않고 숨깁니다(소프트 삭제). 지운 문서는 목록 · 상세 · 20개 상한 · 면접 시작에서
 * 빠지고, **이 문서로 본 지난 면접 기록과 리포트는 그대로 남습니다.** 올린 파일(S3)은 항상 지워서
 * 되돌릴 수 없습니다.
 *
 * - 없는 문서 · 남의 문서 · **이미 지운 문서** 모두 `DOCUMENT_NOT_FOUND`(404) 입니다
 * - 분당 30회 (`RATE_LIMIT_EXCEEDED`)
 */
export function deleteDocument(documentId: string) {
  return api.delete<void>(`/api/documents/${encodeURIComponent(documentId)}`)
}

/**
 * 문서 제목 수정. `PATCH /api/documents/{documentId}` (본문 `{ title }`)
 *
 * API 명세(Notion "문서 제목 수정") 기준입니다. ⚠️ **백엔드는 아직 시작 전**이라 `DocumentController` 에는 등록 ·
 * 목록 · 상세 · 삭제만 있습니다. 올라오면 이 함수와 목업, `CAN_RENAME_DOCUMENT` 를 맞춥니다.
 * (docs/90-open-questions.md Q15)
 *
 * 명세에서 정해진 것
 * - 본문은 `{ title?, content? }` 입니다. **화면은 `title` 만 보냅니다.** `content` 는 직접 작성 문서만 바꿀 수 있고,
 *   파일 문서에 보내면 400 `CONTENT_NOT_EDITABLE` 입니다 — 본문 수정 화면이 생기면 그때 씁니다
 * - 제목은 최대 100자
 * - 응답은 `{ documentId, title, updatedAt }` — 바뀐 제목만 읽습니다 (`DocumentUpdateResponse`). 명세 예시의
 *   `indexStatus` 는 필요 없는 값으로 백엔드와 확인했습니다
 *
 * 명세에 없어서 **등록 · 상세와 같다고 본 것** (백엔드 확인 필요)
 * - 빈 제목 · 100자 초과는 `INVALID_REQUEST`, 100자는 앞뒤 공백을 뺀 길이
 * - 없는 문서 · 남의 문서 · 지운 문서는 `DOCUMENT_NOT_FOUND`(404)
 * - 실패 응답의 코드는 다른 API 처럼 `errorCode` 로 옵니다. 명세 예시는 `code` 로 적혀 있는데, 백엔드 공용
 *   응답(`Result`)은 `errorCode` 입니다
 */
export async function updateDocumentTitle(documentId: string, title: string) {
  const response = await api.patch<DocumentUpdateResponse>(`/api/documents/${encodeURIComponent(documentId)}`, {
    title,
  })
  return { documentId: response.documentId, title: response.title }
}

/**
 * 제목 수정을 쓸 수 있는지. **문서가 목업일 때만** true 입니다. 환경 변수로 정해져서 실행 중에 바뀌지 않습니다.
 *
 * 수정 API 가 백엔드에 아직 없어서(명세만 있고 시작 전), 문서를 실제 서버에 붙이면(`VITE_REAL_APIS=documents` 또는
 * `VITE_USE_MOCK=false`) 보낼 곳이 없습니다. 이 API 만 목업이 답하게(`missingInBackend`) 두지도 않았습니다 — 목업
 * 저장소는 실제 서버의 문서 id 를 몰라서 "없는 문서" 라고 답하고, 화면은 멀쩡한 문서를 지워졌다고 안내하게 됩니다.
 * 그래서 그때는 화면이 수정 버튼을 내지 않습니다. 백엔드에 API 가 생기면 이 상수를 지웁니다.
 */
export const CAN_RENAME_DOCUMENT = !isRealApi('/api/documents')
