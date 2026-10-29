import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createPracticeFolder } from '../api/practiceApi'
import type { PracticeFolder } from '../types/practice'

export type UseCreateFolderResult = {
  /** 만든 폴더, 실패하면 null(`error` 에 문구) */
  create: (name: string) => Promise<PracticeFolder | null>
  creating: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  /** 실패 문구를 지웁니다. 이름을 다시 고치기 시작하면 부릅니다 (useRenameDocument 와 같은 방식) */
  clearError: () => void
}

/** 연습 기록 폴더를 만듭니다. (`POST /api/folders` — 백엔드에 없어 목업이 답합니다) */
export function useCreateFolder(): UseCreateFolderResult {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (name: string) => {
    setCreating(true)
    setError(null)

    try {
      return await createPracticeFolder(name)
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      // 이름은 남기지 않습니다. 회사 이름이 들어갑니다. 길이와 코드만 남깁니다.
      console.error('폴더 만들기 실패 length=%d code=%s', name.length, code)
      setError(toUserMessage(code))
      return null
    } finally {
      setCreating(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { create, creating, error, clearError }
}
