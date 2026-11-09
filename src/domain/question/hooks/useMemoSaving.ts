import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

export type SaveMemoResult = { ok: true; memo: string | null } | { ok: false }

export type UseMemoSavingResult = {
  /** 저장하는 요청을 대신 보내 주고, 저장된 메모(지웠으면 null)를 돌려줍니다. 실패하면 `error` 에 문구가 있습니다 */
  run: (send: () => Promise<string | null>) => Promise<SaveMemoResult>
  saving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  clearError: () => void
}

/**
 * 메모 저장 요청의 진행 · 실패 상태입니다. 북마크 메모(`useSaveBookmarkMemo`)와 공통 질문 메모(`useSaveCommonMemo`)가
 * 같이 씁니다 — 보내는 API 만 다르고 저장 중 잠그기 · 실패 문구는 같습니다.
 */
export function useMemoSaving(): UseMemoSavingResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (send: () => Promise<string | null>): Promise<SaveMemoResult> => {
    setSaving(true)
    setError(null)

    try {
      return { ok: true, memo: await send() }
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      console.error('메모 저장 실패 code=%s', code)
      setError(toUserMessage(code))
      return { ok: false }
    } finally {
      setSaving(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { run, saving, error, clearError }
}
