import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { canRenameDocument, updateDocumentTitle } from '../api/documentApi'
import type { DocumentSummary } from '../types/document'

export type RenameResult = { kind: 'renamed'; document: DocumentSummary } | { kind: 'gone' } | { kind: 'failed' }

export type UseRenameDocumentResult = {
  /**
   * `renamed` 바꿨음(바뀐 문서) · `gone` 이미 없음 · `failed` 그 밖의 실패(`error` 에 문구).
   *
   * 다른 탭에서 지운 문서는 `DOCUMENT_NOT_FOUND` 로 옵니다. 지우기와 마찬가지로 실패가 아니라 `gone` 으로
   * 돌려주고, 화면은 목록을 새로 부릅니다 (useDeleteDocument).
   */
  rename: (documentId: string, title: string) => Promise<RenameResult>
  renaming: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
}

/**
 * 제목 수정을 화면에 낼 수 있는지. 문서를 실제 서버에 붙인 동안은 false 입니다 — 수정 API 가 백엔드에 아직
 * 없습니다 (`documentApi.ts` 의 `canRenameDocument`). 환경 변수로 정해져서 실행 중에 바뀌지 않습니다.
 */
export const CAN_RENAME_DOCUMENT = canRenameDocument()

/**
 * 보관함 문서의 제목을 바꿉니다. (C-02)
 *
 * ⚠️ 백엔드에 수정 API 가 아직 없어서 계약을 가정했고, 지금은 목업에서만 동작합니다
 * (`documentApi.ts` 의 `updateDocumentTitle`, docs/90-open-questions.md Q15).
 */
export function useRenameDocument(): UseRenameDocumentResult {
  const [renaming, setRenaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rename = useCallback(async (documentId: string, title: string): Promise<RenameResult> => {
    setRenaming(true)
    setError(null)

    try {
      return { kind: 'renamed', document: await updateDocumentTitle(documentId, title) }
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      if (code === 'DOCUMENT_NOT_FOUND') return { kind: 'gone' }

      // 제목은 남기지 않습니다. 회사 이름 등이 들어갈 수 있습니다. 길이와 코드만 남깁니다.
      console.error('문서 제목 수정 실패 length=%d code=%s', title.length, code)
      setError(toUserMessage(code))
      return { kind: 'failed' }
    } finally {
      setRenaming(false)
    }
  }, [])

  return { rename, renaming, error }
}
