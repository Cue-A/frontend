import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { deleteDocument } from '../api/documentApi'

export type DeleteResult = 'deleted' | 'gone' | 'failed'

export type UseDeleteDocumentResult = {
  /**
   * `deleted` 지웠음 · `gone` 이미 없음 · `failed` 그 밖의 실패(`error` 에 문구).
   *
   * 이미 지운 문서도 백엔드는 "없는 문서"(`DOCUMENT_NOT_FOUND`)로 답합니다. 다른 탭에서 지운 경우라
   * 실패가 아니라 `gone` 으로 돌려주고, 화면은 목록을 새로 부릅니다 — 남은 줄이 실제로는 없는 문서입니다.
   */
  remove: (documentId: string) => Promise<DeleteResult>
  deleting: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  clearError: () => void
}

/**
 * 보관함 문서를 지웁니다. (C-02, Cue-A/backend#40)
 *
 * 되돌릴 수 없어서 화면이 먼저 한 번 묻고 이 훅을 부릅니다 (DocumentDeleteDialog).
 */
export function useDeleteDocument(): UseDeleteDocumentResult {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = useCallback(async (documentId: string): Promise<DeleteResult> => {
    setDeleting(true)
    setError(null)

    try {
      await deleteDocument(documentId)
      return 'deleted'
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      if (code === 'DOCUMENT_NOT_FOUND') return 'gone'

      console.error('문서 삭제 실패 code=%s', code)
      setError(toUserMessage(code))
      return 'failed'
    } finally {
      setDeleting(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { remove, deleting, error, clearError }
}
