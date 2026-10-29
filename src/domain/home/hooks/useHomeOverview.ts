import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getHomeOverview } from '../api/homeApi'
import type { HomeOverview } from '../types/home'

export type UseHomeOverviewResult =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError; retry: () => void }
  | { status: 'ready'; overview: HomeOverview }

type Settled = { status: 'error'; error: ApiError } | { status: 'ready'; overview: HomeOverview }

/**
 * 홈에서 기간 탭과 상관없는 것(이번 달 · 연속 학습 · 최근 리포트 · 배지 · 목표 · 일정 · 인재상 · 질문은행)을
 * 한 번 불러옵니다.
 */
export function useHomeOverview(): UseHomeOverviewResult {
  const [settled, setSettled] = useState<Settled | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getHomeOverview()
      .then((overview) => {
        if (!cancelled) setSettled({ status: 'ready', overview })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('홈 대시보드 조회 실패 code=%s', apiError.code)
        setSettled({ status: 'error', error: apiError })
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  // 다시 시도를 누르면 에러 화면을 바로 걷고 로딩으로 돌립니다. effect 안에서 비우면 한 박자 늦게 비워집니다.
  const retry = useCallback(() => {
    setSettled(null)
    setAttempt((value) => value + 1)
  }, [])

  if (settled === null) return { status: 'loading' }
  if (settled.status === 'error') return { ...settled, retry }
  return settled
}
