import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getGrowthOverview } from '../api/growthApi'
import type { GrowthOverview, WeeklyGoal } from '../types/growth'

export type UseGrowthOverviewResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; overview: GrowthOverview }
) & {
  /** 오류 안내의 "다시 시도" 에 씁니다. 불러오는 중으로 바꾼 뒤 다시 받습니다 */
  reload: () => void
  /**
   * 목표를 저장한 응답을 그대로 화면에 넣습니다. 다시 받지 않습니다 — 다시 받다가 실패하면 보던 카드가 통째로 오류
   * 카드로 바뀌고, 목표 하나 바꿨다고 요약 전체를 다시 받을 이유도 없습니다. (PR #137 리뷰)
   */
  applyWeeklyGoal: (goal: WeeklyGoal) => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; overview: GrowthOverview }

/**
 * 성장 관리의 이번 주 목표 · 배지와, 점수 추이 · 이전 회차 대비 변화의 기준이 될 가장 최근 리포트입니다.
 * (`GET /api/growth` — 백엔드에 없어 목업이 답합니다)
 *
 * 점수 추이 · 이전 회차 대비 변화는 여기서 받은 리포트로 회차 비교(`useReportComparison`)를 따로 부릅니다.
 * 캘린더도 달을 넘길 때마다 다시 받아야 해서 따로 받습니다(`useCalendarMonth`).
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

  const applyWeeklyGoal = useCallback((goal: WeeklyGoal) => {
    setState((previous) =>
      previous.status === 'ready' ? { status: 'ready', overview: { ...previous.overview, weeklyGoal: goal } } : previous,
    )
  }, [])

  return { ...state, reload, applyWeeklyGoal }
}
