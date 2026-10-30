import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getGrowthOverview } from '../api/growthApi'
import type { GrowthOverview } from '../types/growth'

export type UseGrowthOverviewResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; overview: GrowthOverview }
) & {
  /** 오류 안내의 "다시 시도" 에 씁니다. 불러오는 중으로 바꾼 뒤 다시 받습니다 */
  reload: () => void
  /** 화면을 그대로 둔 채 뒤에서 다시 받습니다. 목표를 고친 직후에 씁니다 */
  refresh: () => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; overview: GrowthOverview }

/**
 * 성장 관리 위쪽 네 카드(점수 추이 · 이번 주 목표 · 배지 · 이전 회차 대비 변화)입니다.
 * (`GET /api/growth` — 백엔드에 없어 목업이 답합니다)
 *
 * 네 카드를 한 번에 받습니다. 캘린더는 달을 넘길 때마다 다시 받아야 해서 따로 받습니다(`useCalendarMonth`).
 */
export function useGrowthOverview(): UseGrowthOverviewResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getGrowthOverview()
      .then((overview) => {
        if (!cancelled) setState({ status: 'ready', overview })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('성장 요약 조회 실패 code=%s', apiError.code)
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
