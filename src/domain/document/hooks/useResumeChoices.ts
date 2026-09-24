import type { ApiError } from '@/shared/api/apiError'

import { DOCUMENT_TYPE_LABEL, formatBadgeOf, formatMeta, interviewBlockReason } from '../lib/documentDisplay'

import { useDocuments } from './useDocuments'

/** 고른 뒤 면접 옵션에 담기는 값. 세션 생성에는 `documentId` 가 `documentPublicId` 로 실립니다. */
export type ResumeSelection = {
  documentId: string
  title: string
  /** 직접 작성한 문서면 null */
  fileName: string | null
  /** 바이트. 직접 작성한 문서면 null */
  fileSize: number | null
}

export type ResumeChoice = {
  selection: ResumeSelection
  /** 형식 뱃지(PDF · DOCX · TXT · 직접) */
  formatLabel: string
  /** `자기소개서 · 2026.09.20 · 1.3MB` — 두 종류가 섞여 나와서 종류를 앞에 붙입니다 */
  meta: string
  /** 고를 수 없는 이유. 고를 수 있으면 null */
  blockReason: string | null
}

export type UseResumeChoicesResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; choices: ResumeChoice[] }
) & { reload: () => void }

/**
 * 옵션 설정(A-05)의 "자기소개서 불러오기" 에 보여줄 보관함 문서입니다.
 *
 * 다른 도메인은 문서 api · 표시 규칙을 직접 가져다 쓰지 않고 이 훅으로만 받습니다
 * (docs/01-conventions.md — 도메인 간 참조는 hooks 레벨). 무엇을 고를 수 없는지도 여기서 정합니다.
 *
 * - **자기소개서와 포트폴리오를 둘 다** 보여줍니다. 백엔드 세션 시작은 문서 종류를 보지 않고
 *   "준비가 끝난 파일 문서인가" 만 봅니다(`InterviewStartService.findUsableFileDocument`).
 *   종류는 목록에서 구분만 해줍니다
 * - 준비가 안 됐거나 직접 작성한 문서는 **목록에 두되 고를 수 없게** 합니다. 빼버리면 보관함에 있는
 *   문서가 왜 안 보이는지 알 수 없습니다
 * - 사용자당 20개가 상한이라 한 번에 전부 받습니다
 */
export function useResumeChoices(): UseResumeChoicesResult {
  const documents = useDocuments()

  if (documents.status !== 'ready') return documents

  const choices = documents.page.documents.map((document) => ({
    selection: {
      documentId: document.documentId,
      title: document.title,
      fileName: document.fileName,
      fileSize: document.fileSize,
    },
    formatLabel: formatBadgeOf(document),
    meta: `${DOCUMENT_TYPE_LABEL[document.documentType]} · ${formatMeta(document)}`,
    blockReason: interviewBlockReason(document),
  }))

  return { status: 'ready', choices, reload: documents.reload }
}
