import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createDocument } from '../api/documentApi'
import type { DocumentSummary, DocumentType } from '../types/document'

export type WriteInput = {
  title: string
  content: string
  documentType: DocumentType
}

export type UseWriteDocumentResult = {
  /** 성공하면 등록된 문서, 실패하면 null. 실패 이유는 `error` 에 남습니다 */
  save: (input: WriteInput) => Promise<DocumentSummary | null>
  saving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  clearError: () => void
}

/**
 * 직접 작성한 문서를 보관함에 저장합니다. (C-02 "직접 작성")
 *
 * 파일 업로드와 같은 엔드포인트(`POST /api/documents`)에 `sourceType=MARKDOWN` 으로 보냅니다.
 * 백엔드가 본문을 DB 에 두고 `.txt` 사본을 S3 에 올려서, 파일 문서처럼 면접에 쓸 수 있습니다
 * (Cue-A/backend#39).
 */
export function useWriteDocument(): UseWriteDocumentResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async ({ title, content, documentType }: WriteInput) => {
    setSaving(true)
    setError(null)

    try {
      return await createDocument({ sourceType: 'MARKDOWN', title, content, documentType })
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      // 본문은 개인정보라 남기지 않습니다. 길이와 코드만 남깁니다.
      console.error('직접 작성 문서 저장 실패 length=%d code=%s', content.length, code)
      setError(toUserMessage(code))
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { save, saving, error, clearError }
}
