import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { DocumentIndexStatus, DocumentSourceType, DocumentType } from '../types/document'

import type { DocumentDetailResponse, DocumentListResponse, DocumentResponse } from './documentResponse'

/**
 * 문서 API 목업입니다. 검증 순서와 에러 코드는 백엔드
 * (`DocumentRegisterService` · `DocumentQueryService` · `FileValidator`)를 그대로 따랐습니다.
 * 목업에서 통과한 입력이 실제 서버에서 처음 거절당하는 일을 줄이려는 것입니다.
 *
 * 저장은 메모리에만 합니다. 새로고침하면 처음 목록으로 돌아갑니다.
 */

const MAX_DOCUMENTS_PER_USER = 20
const MAX_TITLE_LENGTH = 100
const MAX_MARKDOWN_LENGTH = 20_000
const MAX_FILE_BYTES = 10 * 1024 * 1024
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

/** 백엔드 `FileValidator.DOCUMENT_TYPES` 와 같은 목록 · 같은 순서입니다. 안내 문구에 순서대로 들어갑니다. */
const ALLOWED_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
}

/** 올리는 중 상태가 화면에 한 번은 보이도록 둔 지연입니다. 실제 속도와는 무관합니다. */
const UPLOAD_DELAY_MS = 600

type StoredDocument = DocumentResponse & {
  content: string | null
  /** 목업에서 "조회" 를 눌렀을 때 열 원본. 직접 올린 파일이면 그 파일입니다. */
  blob: Blob | null
  updatedAt: string
}

/**
 * 처음 목록. 화면의 상태 분기를 전부 확인할 수 있게 네 상태를 다 넣었습니다.
 * 실제 서버는 지금 `COMPLETED` 만 줍니다 (types/document.ts 의 DocumentIndexStatus 주석).
 */
const SEED: Array<{
  documentId: string
  documentType: DocumentType
  sourceType: DocumentSourceType
  title: string
  fileName: string | null
  fileSize: number | null
  indexStatus: DocumentIndexStatus
  createdAt: string
  content?: string
}> = [
  {
    documentId: '6f1c2a3b-4d5e-4f60-8a1b-2c3d4e5f6071',
    documentType: 'RESUME',
    sourceType: 'FILE',
    title: '카카오_자기소개서.pdf',
    fileName: '카카오_자기소개서.pdf',
    fileSize: 1_363_148,
    indexStatus: 'COMPLETED',
    createdAt: '2026-09-20T14:02:11+09:00',
  },
  {
    documentId: '7a2d3b4c-5e6f-4071-9b2c-3d4e5f607182',
    documentType: 'RESUME',
    sourceType: 'MARKDOWN',
    title: '직접 작성한 자기소개서',
    fileName: null,
    fileSize: null,
    indexStatus: 'COMPLETED',
    createdAt: '2026-09-18T21:40:05+09:00',
    content: '## 지원 동기\n\n사용자가 매일 쓰는 화면을 더 빠르게 만드는 일에 관심이 있습니다.\n',
  },
  {
    documentId: '8b3e4c5d-6f70-4182-8c3d-4e5f60718293',
    documentType: 'PORTFOLIO',
    sourceType: 'FILE',
    title: '프론트엔드_포트폴리오.pdf',
    fileName: '프론트엔드_포트폴리오.pdf',
    fileSize: 3_250_585,
    indexStatus: 'COMPLETED',
    createdAt: '2026-09-15T10:11:12+09:00',
  },
  {
    documentId: '9c4f5d6e-7081-4293-9d4e-5f60718293a4',
    documentType: 'RESUME',
    sourceType: 'FILE',
    title: '네이버_자소서_초안.docx',
    fileName: '네이버_자소서_초안.docx',
    fileSize: 838_860,
    indexStatus: 'PROCESSING',
    createdAt: '2026-09-12T09:30:00+09:00',
  },
  {
    documentId: 'ad5a6e7f-8192-43a4-8e5f-60718293a4b5',
    documentType: 'RESUME',
    sourceType: 'FILE',
    title: '토스_자기소개서.docx',
    fileName: '토스_자기소개서.docx',
    fileSize: 512_000,
    indexStatus: 'OUTDATED',
    createdAt: '2026-09-10T18:22:47+09:00',
  },
  {
    documentId: 'be6b7f80-92a3-44b5-9f60-718293a4b5c6',
    documentType: 'RESUME',
    sourceType: 'FILE',
    title: '당근_자소서.txt',
    fileName: '당근_자소서.txt',
    fileSize: 24_310,
    indexStatus: 'FAILED',
    createdAt: '2026-09-08T08:05:59+09:00',
  },
]

const store: StoredDocument[] = SEED.map((seed) => ({
  ...seed,
  content: seed.content ?? null,
  // 시드 문서엔 실제 파일이 없어서, 조회하면 안내 문구가 담긴 텍스트를 엽니다.
  blob:
    seed.sourceType === 'FILE'
      ? new Blob([`목업 문서입니다 — 실제 파일이 아닙니다.\n${seed.fileName ?? ''}`], { type: 'text/plain' })
      : null,
  updatedAt: seed.createdAt,
}))

/** 문서마다 만든 object URL 을 재사용합니다. 조회할 때마다 새로 만들면 해제되지 않고 쌓입니다. */
const downloadUrls = new Map<string, string>()

function nowIso() {
  // 백엔드처럼 +09:00 을 붙입니다. toISOString() 은 Z(UTC) 로 나가 모양이 달라집니다.
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return `${now.toISOString().slice(0, 19)}+09:00`
}

function toResponse(document: StoredDocument): DocumentResponse {
  return {
    documentId: document.documentId,
    documentType: document.documentType,
    sourceType: document.sourceType,
    title: document.title,
    fileName: document.fileName,
    fileSize: document.fileSize,
    indexStatus: document.indexStatus,
    createdAt: document.createdAt,
  }
}

function readString(form: FormData, key: string): string | null {
  const value = form.get(key)
  return typeof value === 'string' ? value : null
}

function parseSourceType(value: string | null): DocumentSourceType {
  if (value === 'FILE' || value === 'MARKDOWN') return value
  // Spring 이 enum 으로 못 바꾸면 요청 자체가 잘못된 것으로 봅니다.
  throw new ApiError('INVALID_REQUEST', `sourceType 이 올바르지 않습니다 (${value ?? '없음'})`)
}

function parseDocumentType(value: string | null): DocumentType {
  if (value === null) return 'RESUME'
  if (value === 'RESUME' || value === 'PORTFOLIO') return value
  throw new ApiError('INVALID_REQUEST', `documentType 이 올바르지 않습니다 (${value})`)
}

/** `FileValidator.validateDocument` 와 같은 순서로 봅니다. 통과하면 소문자 확장자를 돌려줍니다. */
function validateFile(file: File) {
  if (!file.name.trim()) {
    throw new ApiError('UNSUPPORTED_FILE_FORMAT', '파일명이 없습니다')
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ApiError('FILE_SIZE_EXCEEDED', `파일 크기가 ${MAX_FILE_BYTES / 1024 / 1024}MB를 초과했습니다`)
  }

  const dot = file.name.lastIndexOf('.')
  if (dot < 0 || dot === file.name.length - 1) {
    throw new ApiError('UNSUPPORTED_FILE_FORMAT', '확장자가 없는 파일입니다')
  }

  const extension = file.name.slice(dot + 1).toLowerCase()
  const expectedMime = ALLOWED_TYPES[extension]
  if (!expectedMime) {
    throw new ApiError(
      'UNSUPPORTED_FILE_FORMAT',
      `지원하지 않는 파일 형식입니다. ${Object.keys(ALLOWED_TYPES).join(', ')}만 업로드할 수 있습니다`,
    )
  }

  const baseMime = file.type.split(';')[0]?.trim().toLowerCase()
  if (baseMime !== expectedMime) {
    throw new ApiError('UNSUPPORTED_FILE_FORMAT', '확장자와 MIME 타입이 맞지 않습니다')
  }
}

function register(form: FormData): DocumentResponse {
  const sourceType = parseSourceType(readString(form, 'sourceType'))
  const documentType = parseDocumentType(readString(form, 'documentType'))
  const title = readString(form, 'title')

  if (title === null || !title.trim()) {
    throw new ApiError('INVALID_REQUEST', 'title 이 필요합니다')
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    throw new ApiError('INVALID_REQUEST', `제목은 ${MAX_TITLE_LENGTH}자 이하여야 합니다`)
  }
  // 백엔드도 업로드보다 상한 검사를 먼저 합니다. 뒤에 두면 10MB 를 다 받은 뒤 거절하게 됩니다.
  if (store.length >= MAX_DOCUMENTS_PER_USER) {
    throw new ApiError('DOCUMENT_LIMIT_EXCEEDED', `문서는 최대 ${MAX_DOCUMENTS_PER_USER}개까지 등록할 수 있습니다`)
  }

  const now = nowIso()
  const base = {
    documentId: crypto.randomUUID(),
    documentType,
    sourceType,
    title: title.trim(),
    // 인덱싱이 없어 실제 서버도 등록 즉시 준비 완료입니다.
    indexStatus: 'COMPLETED' as const,
    createdAt: now,
    updatedAt: now,
  }

  let document: StoredDocument

  if (sourceType === 'FILE') {
    const file = form.get('file')
    // 컨트롤러가 빈 파일을 null 로 바꿔서 넘기므로, 빈 파일도 여기서 걸립니다.
    if (!(file instanceof File) || file.size === 0) {
      throw new ApiError('INVALID_SOURCE_TYPE', 'sourceType=FILE 이면 file 이 필요합니다')
    }
    validateFile(file)

    document = { ...base, fileName: file.name, fileSize: file.size, content: null, blob: file }
  } else {
    const content = readString(form, 'content')
    if (content === null || !content.trim()) {
      throw new ApiError('INVALID_SOURCE_TYPE', 'sourceType=MARKDOWN 이면 content 가 필요합니다')
    }
    if (content.length > MAX_MARKDOWN_LENGTH) {
      throw new ApiError('INVALID_REQUEST', `본문은 ${MAX_MARKDOWN_LENGTH.toLocaleString()}자 이하여야 합니다`)
    }

    document = { ...base, fileName: null, fileSize: null, content, blob: null }
  }

  store.push(document)
  return toResponse(document)
}

function parseNumber(value: string | null): number | null {
  if (value === null) return null
  const number = Number(value)
  if (!Number.isInteger(number)) {
    throw new ApiError('INVALID_REQUEST', `숫자가 아닙니다 (${value})`)
  }
  return number
}

registerMock('POST', '/api/documents', async (_params, body) => {
  if (!(body instanceof FormData)) {
    throw new ApiError('INVALID_REQUEST', 'multipart/form-data 로 보내야 합니다')
  }

  await new Promise((resolve) => setTimeout(resolve, UPLOAD_DELAY_MS))
  return register(body)
})

registerMock('GET', '/api/documents', (_params, _body, query): DocumentListResponse => {
  const documentType = query.has('documentType') ? parseDocumentType(query.get('documentType')) : null
  const pageParam = parseNumber(query.get('page'))
  const sizeParam = parseNumber(query.get('size'))

  // 백엔드 DocumentQueryService.pageOf · sizeOf 와 같은 보정입니다. 범위를 벗어나도 거절하지 않고 맞춥니다.
  const page = pageParam === null || pageParam < 0 ? 0 : pageParam
  const size = sizeParam === null || sizeParam < 1 ? DEFAULT_PAGE_SIZE : Math.min(sizeParam, MAX_PAGE_SIZE)

  // 뒤집고 나서 정렬합니다. createdAt 이 초 단위라 연달아 올리면 값이 같아지는데,
  // sort 는 같은 값의 순서를 유지하므로 뒤집어 두면 나중에 올린 게 앞에 옵니다.
  const filtered = [...store]
    .reverse()
    .filter((document) => documentType === null || document.documentType === documentType)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    documents: filtered.slice(page * size, page * size + size).map(toResponse),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
  }
})

registerMock('GET', '/api/documents/:documentId', ({ documentId }): DocumentDetailResponse => {
  const document = store.find((item) => item.documentId === documentId)
  // 없는 문서 · 남의 문서 · UUID 가 아닌 값 전부 같은 코드입니다.
  if (!document) {
    throw new ApiError('DOCUMENT_NOT_FOUND', '문서를 찾을 수 없습니다')
  }

  let downloadUrl: string | null = null
  if (document.sourceType === 'FILE' && document.blob) {
    downloadUrl = downloadUrls.get(document.documentId) ?? URL.createObjectURL(document.blob)
    downloadUrls.set(document.documentId, downloadUrl)
  }

  return {
    documentId: document.documentId,
    documentType: document.documentType,
    sourceType: document.sourceType,
    title: document.title,
    content: document.sourceType === 'MARKDOWN' ? document.content : null,
    downloadUrl,
    indexStatus: document.indexStatus,
    indexedAt: null,
    indexError: null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  }
})
