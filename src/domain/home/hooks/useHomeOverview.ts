import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getHomeExtras, getHomeGrowth, getHomeStats, getRecentReports, getUpcomingEvents } from '../api/homeApi'
import type { HomeExtras, HomeGrowth, HomeStats, RecentReport, UpcomingEvent } from '../types/home'

/** 홈의 한 칸. 칸마다 따로 받아서, 한 칸이 실패해도 다른 칸은 보입니다 */
export type HomeSection<T> = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'ready'; data: T }
) & {
  /** 이 칸만 다시 받습니다 */
  retry: () => void
}

type Settled<T> = { status: 'error'; error: ApiError } | { status: 'ready'; data: T }

function useSection<T>(load: () => Promise<T>, label: string): HomeSection<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    load()
      .then((data) => {
        if (!cancelled) setSettled({ status: 'ready', data })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('홈 %s 조회 실패 code=%s', label, apiError.code)
        setSettled({ status: 'error', error: apiError })
      })

    return () => {
      cancelled = true
    }
  }, [load, label, attempt])

  // 다시 시도를 누르면 에러를 바로 걷고 로딩으로 돌립니다. effect 안에서 비우면 한 박자 늦게 비워집니다.
  const retry = useCallback(() => {
    setSettled(null)
    setAttempt((value) => value + 1)
  }, [])

  if (settled === null) return { status: 'loading', retry }
  return { ...settled, retry }
}

export type UseHomeOverviewResult = {
  /** 이번 달 · 연속 학습 (`/api/home/stats`) */
  stats: HomeSection<HomeStats>
  /** 최근 리포트 (`/api/home/recent-reports`) */
  recentReports: HomeSection<RecentReport[]>
  /** 이번 주 목표 · 배지 (`/api/growth`, 성장 관리와 같은 값 · 이슈 #201) */
  growth: HomeSection<HomeGrowth>
  /** 다가오는 면접일 (`/api/calendar/events/upcoming`, 이슈 #201) */
  upcomingEvents: HomeSection<UpcomingEvent[]>
  /** 인재상 · 질문은행 (`/api/home`, 백엔드에 없어 목업이 답합니다) */
  extras: HomeSection<HomeExtras>
}

/**
 * 홈에서 기간 탭과 상관없는 것을 칸별로 받습니다.
 *
 * 전에는 `GET /api/home` 하나로 다 받았는데, 백엔드는 홈을 영역별로 나눠 줍니다 — 이번 달 · 연속 학습(`/stats`), 최근
 * 리포트(`/recent-reports`, Cue-A/backend#108 · #116), 목표 · 배지(`/api/growth`), 다가오는 일정(`/api/calendar/events/upcoming`).
 * 영역마다 도메인(`VITE_REAL_APIS`)도 달라 실서버 · 목업이 섞일 수 있어서, 한쪽이 실패해도 다른 칸은 보이도록 따로 받고 다시
 * 시도도 칸별로 합니다.
 */
export function useHomeOverview(): UseHomeOverviewResult {
  const stats = useSection(getHomeStats, '연습 통계')
  const recentReports = useSection(getRecentReports, '최근 리포트')
  const growth = useSection(getHomeGrowth, '목표 · 배지')
  const upcomingEvents = useSection(getUpcomingEvents, '다가오는 일정')
  const extras = useSection(getHomeExtras, '인재상 · 질문은행')

  return { stats, recentReports, growth, upcomingEvents, extras }
}
