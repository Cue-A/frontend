import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getPracticeFolders } from '../api/practiceApi'
import type { PracticeFolders } from '../types/practice'

export type UsePracticeFoldersResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; folders: PracticeFolders }
) & {
  /** 실패 안내의 "다시 시도" 에 씁니다 */
  reload: () => void
  /** 카드를 그대로 둔 채 뒤에서 다시 받습니다. 폴더를 만든 직후에 씁니다 (useDocuments 의 refresh 와 같습니다) */
  refresh: () => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; folders: PracticeFolders }

/** 연습 기록 위쪽의 폴더 카드(전체 · 폴더들 · 기타)와 그 숫자입니다. (`GET /api/folders` — 백엔드에 없어 목업이 답합니다) */
export function usePracticeFolders(): UsePracticeFoldersResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getPracticeFolders()
      .then((folders) => {
        if (!cancelled) setState({ status: 'ready', folders })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('폴더 목록 조회 실패 code=%s', apiError.code)
        setState({ status: 'error', error: apiError })
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  const refresh = useCallback(() => setAttempt((value) => value + 1), [])

  return { ...state, reload, refresh }
}
