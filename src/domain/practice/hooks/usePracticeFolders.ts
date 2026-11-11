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
  /**
   * 카드를 그대로 둔 채 뒤에서 다시 받습니다. 폴더를 만들거나 옮긴 직후에 씁니다.
   * **다시 받기가 실패해도 이미 받은 폴더는 그대로 둡니다** — 숫자가 잠깐 낡을 뿐인데 오류로 바꾸면 카드 줄과, 폴더 목록이 필요한
   * 창(만들기 · 이름 바꾸기 · 옮기기)이 통째로 사라집니다 (PR #206 리뷰). 처음 받기 · "다시 시도"(`reload`)의 실패만 오류로 보여줍니다
   */
  refresh: () => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; folders: PracticeFolders }

/** 연습 기록 위쪽의 폴더 카드(전체 · 폴더들)와 그 숫자입니다. (`GET /api/folders`) */
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
        // 이미 받은 폴더가 있으면(뒤에서 다시 받기) 그대로 둡니다
        setState((previous) => (previous.status === 'ready' ? previous : { status: 'error', error: apiError }))
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
