import type { DocumentIndexStatus, DocumentSummary, DocumentType } from '../types/document'

/**
 * 보관함 목록(C-02)에 보여줄 글자를 만듭니다. 화면은 이 함수들의 결과만 그립니다.
 *
 * 시안에 있는 "질문 12개 생성됨", "문항 추출 중 (72%)" 같은 문구는 **서버가 주는 값이
 * 아니라서** 쓰지 않습니다. 없는 진행률을 지어내면 사용자는 그 숫자를 믿고 기다립니다.
 * (이슈 #59)
 */

export type DocumentTab = 'ALL' | 'RESUME' | 'PORTFOLIO' | 'FAILED'

export const DOCUMENT_TABS: { value: DocumentTab; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'RESUME', label: '자기소개서' },
  { value: 'PORTFOLIO', label: '포트폴리오' },
  { value: 'FAILED', label: '분석 실패' },
]

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  RESUME: '자기소개서',
  PORTFOLIO: '포트폴리오',
}

type StatusView = {
  label: string
  tone: 'success' | 'info' | 'warning' | 'danger'
  /** 행의 보조 문구. 사용자가 이 문서로 무엇을 할 수 있는지를 말합니다. */
  description: string
}

/**
 * `OUTDATED` 를 `PROCESSING` 과 다르게 부르는 이유 — 처음 올린 문서가 준비 중인 건 당연하지만,
 * 쓰던 문서가 갑자기 막히면 사용자는 이유를 모릅니다. 고쳐서 다시 준비한다고 말해줍니다.
 */
export const STATUS_VIEW: Record<DocumentIndexStatus, StatusView> = {
  COMPLETED: { label: '완료', tone: 'success', description: '면접에 쓸 수 있어요' },
  PROCESSING: { label: '분석 중', tone: 'info', description: '면접에 쓸 수 있게 준비하고 있어요' },
  OUTDATED: { label: '다시 준비 중', tone: 'warning', description: '고친 내용을 다시 준비하고 있어요' },
  FAILED: { label: '실패', tone: 'danger', description: '문서를 읽지 못했어요. 다시 올려주세요' },
}

/**
 * 행의 보조 문구입니다.
 *
 * 직접 작성한 문서는 준비가 끝나도 **아직 면접에 쓸 수 없습니다.** 백엔드가 면접 시작을
 * 파일 문서로만 받습니다 (Cue-A/backend#36). "면접에 쓸 수 있어요" 라고 해두면 A-05 에서
 * 고르려다 막힙니다.
 */
export function describeDocument(document: DocumentSummary): string {
  const typeLabel = DOCUMENT_TYPE_LABEL[document.documentType]

  if (document.sourceType === 'MARKDOWN' && document.indexStatus === 'COMPLETED') {
    return `${typeLabel} · 직접 작성한 문서는 아직 면접에 쓸 수 없어요`
  }

  return `${typeLabel} · ${STATUS_VIEW[document.indexStatus].description}`
}

/** 행 왼쪽의 형식 뱃지. 확장자가 없거나 낯설면 `FILE` 로 둡니다. */
export function formatBadgeOf(document: DocumentSummary): string {
  if (document.sourceType === 'MARKDOWN') return '직접'

  const name = document.fileName ?? ''
  const dot = name.lastIndexOf('.')
  const extension = dot < 0 ? '' : name.slice(dot + 1).toUpperCase()
  return extension || 'FILE'
}

/** `2026-09-20T14:02:11+09:00` → `2026.09.20` (보는 사람의 시간대 기준) */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${month}.${day}`
}

/**
 * 시안은 `1.2MB` · `0.8MB` 처럼 MB 한 자리입니다. 0.1MB 보다 작으면 `0.0MB` 가 되어
 * 빈 파일처럼 보이므로 그때만 KB 로 씁니다.
 */
export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb >= 0.1) return `${mb.toFixed(1)}MB`

  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

/** 등록일 · 용량 칸. 직접 작성한 문서는 파일 크기가 없습니다. */
export function formatMeta(document: DocumentSummary): string {
  const size = document.fileSize === null ? '직접 작성' : formatFileSize(document.fileSize)
  return `${formatDate(document.createdAt)} · ${size}`
}

/** 탭과 검색어로 거릅니다. 검색은 제목과 원본 파일명 둘 다 봅니다. 대소문자는 가리지 않습니다. */
export function filterDocuments(documents: DocumentSummary[], tab: DocumentTab, query: string): DocumentSummary[] {
  const keyword = query.trim().toLowerCase()

  return documents.filter((document) => {
    if (tab === 'FAILED' && document.indexStatus !== 'FAILED') return false
    if ((tab === 'RESUME' || tab === 'PORTFOLIO') && document.documentType !== tab) return false
    if (!keyword) return true

    return [document.title, document.fileName ?? ''].some((text) => text.toLowerCase().includes(keyword))
  })
}
