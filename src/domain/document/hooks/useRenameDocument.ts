import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { updateDocumentTitle } from '../api/documentApi'
export type RenameResult = { kind: 'renamed'; title: string } | { kind: 'gone' } | { kind: 'failed' }

export type UseRenameDocumentResult = {
  /**
   * `renamed` 바꿨음(서버가 저장한 제목) · `gone` 이미 없음 · `failed` 그 밖의 실패(`error` 에 문구).
   *
   * 수정 응답에는 제목만 쓸 만한 값이라(종류 · 파일명 · 등록일이 없습니다) 문서 전체가 아니라 제목을 돌려줍니다.
   *
   * 다른 탭에서 지운 문서는 `DOCUMENT_NOT_FOUND` 로 옵니다. 지우기와 마찬가지로 실패가 아니라 `gone` 으로
   * 돌려주고, 화면은 목록을 새로 부릅니다 (useDeleteDocument).
   */
  rename: (documentId: string, title: string) => Promise<RenameResult>
  renaming: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  /** 실패 문구를 지웁니다. 제목을 다시 고치기 시작하면 부릅니다 (useWriteDocument 와 같은 방식) */
  clearError: () => void
}

/**
 * 보관함 문서의 제목을 바꿉니다. (C-02)
 *
 * ⚠️ API 명세는 있지만 백엔드가 아직 시작 전이라, 지금은 목업에서만 동작합니다
 * (`documentApi.ts` 의 `updateDocumentTitle`, docs/90-open-questions.md Q15).
 */
export function useRenameDocument(): UseRenameDocumentResult {
  const [renaming, setRenaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rename = useCallback(async (documentId: string, title: string): Promise<RenameResult> => {
    setRenaming(true)
    setError(null)

    try {
      const updated = await updateDocumentTitle(documentId, title)
      return { kind: 'renamed', title: updated.title }
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

  const clearError = useCallback(() => setError(null), [])

  return { rename, renaming, error, clearError }
}
