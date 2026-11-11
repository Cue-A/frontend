import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { deletePracticeFolder } from '../api/practiceApi'

/** `deleted` 지웠음 · `gone` 이미 없음 · `failed` 그 밖의 실패(`error` 에 문구) */
export type DeleteFolderResult = 'deleted' | 'gone' | 'failed'

export type UseDeleteFolderResult = {
  remove: (folderId: string) => Promise<DeleteFolderResult>
  deleting: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
}

/**
 * 연습 기록 폴더를 지웁니다. `DELETE /api/folders/{folderId}` (이슈 #205)
 *
 * 안의 세션은 지워지지 않고 폴더에서만 빠집니다. 이미 지운 폴더는 `FOLDER_NOT_FOUND` 로 오는데, 다른 탭에서 지운 경우라
 * 실패가 아니라 `gone` 으로 돌려주고 화면은 폴더를 새로 부릅니다 (useDeleteDocument 와 같습니다).
 */
export function useDeleteFolder(): UseDeleteFolderResult {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = useCallback(async (folderId: string): Promise<DeleteFolderResult> => {
    setDeleting(true)
    setError(null)

    try {
      await deletePracticeFolder(folderId)
      return 'deleted'
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      if (code === 'FOLDER_NOT_FOUND') return 'gone'

      console.error('폴더 삭제 실패 code=%s', code)
      setError(toUserMessage(code))
      return 'failed'
    } finally {
      setDeleting(false)
    }
  }, [])

  return { remove, deleting, error }
}
