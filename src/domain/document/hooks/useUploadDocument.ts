import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createDocument } from '../api/documentApi'
import type { DocumentSummary, DocumentType } from '../types/document'

export type UploadInput = {
  file: File
  title: string
  documentType: DocumentType
}

export type UseUploadDocumentResult = {
  /** 성공하면 등록된 문서, 실패하면 null. 실패 이유는 `error` 에 남습니다 */
  upload: (input: UploadInput) => Promise<DocumentSummary | null>
  uploading: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  clearError: () => void
}

/**
 * 파일 하나를 보관함에 올립니다. (C-02, 이슈 #54 1-4)
 *
 * 진행률은 없습니다. `fetch` 는 업로드 진행률을 알려주지 않고, 없는 값을 지어낸 진행바는
 * 넣지 않습니다(#54 1-4). 10MB 까지라 "올리는 중" 상태만으로 충분하다고 봤습니다.
 */
export function useUploadDocument(): UseUploadDocumentResult {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async ({ file, title, documentType }: UploadInput) => {
    setUploading(true)
    setError(null)

    try {
      return await createDocument({ sourceType: 'FILE', file, title, documentType })
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      // 파일 내용은 개인정보라 남기지 않습니다. 크기와 코드만 남깁니다.
      console.error('문서 업로드 실패 size=%d code=%s', file.size, code)
      setError(toUserMessage(code))
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { upload, uploading, error, clearError }
}
