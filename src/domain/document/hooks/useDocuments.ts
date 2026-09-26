import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getDocuments } from '../api/documentApi'
import type { DocumentPage } from '../types/document'

/**
 * 한 번에 받는 개수. 사용자당 문서 상한(20개)과 같아서 **한 페이지에 전부 옵니다.**
 * 그래서 탭 · 검색은 서버에 다시 묻지 않고 화면에서 거릅니다. 서버 필터는
 * `documentType` 하나뿐이라, "분석 실패" 탭이나 파일명 검색은 어차피 서버가 못 해줍니다.
 */
export const DOCUMENT_PAGE_SIZE = 20

export type UseDocumentsResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; page: DocumentPage }
) & {
  /** 에러 화면의 "다시 시도" 에 씁니다. 불러오는 중 화면으로 바꾼 뒤 다시 받습니다. */
  reload: () => void
  /**
   * 목록을 그대로 둔 채 뒤에서 다시 받습니다. 문서를 올린 직후에 씁니다 — reload 를 쓰면
   * 표가 "불러오는 중" 으로 잠깐 비었다가 다시 채워져서 깜빡입니다.
   */
  refresh: () => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; page: DocumentPage }

export function useDocuments(): UseDocumentsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getDocuments({ size: DOCUMENT_PAGE_SIZE })
      .then((page) => {
        if (!cancelled) setState({ status: 'ready', page })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('문서 목록 조회 실패 code=%s', apiError.code)
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
