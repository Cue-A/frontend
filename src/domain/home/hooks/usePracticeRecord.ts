import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getPracticeRecord } from '../api/homeApi'
import type { PracticePeriod, PracticeRecord } from '../types/home'

export type UsePracticeRecordResult = {
  /** 마지막으로 받은 기록. 탭을 바꾸는 중이면 **이전 탭의 기록**입니다 (`isStale`) */
  record: PracticeRecord | null
  /** 지금 고른 탭의 기록을 받는 중이라 `record` 가 이전 탭 것인지 */
  isStale: boolean
  /** 지금 고른 탭의 기록을 못 받았으면 그 에러 */
  error: ApiError | null
  retry: () => void
}

/**
 * 연습 기록(잔디 · 점수 추이 · 기간 평균 · 총 연습)을 고른 기간만큼 불러옵니다.
 *
 * 탭을 바꿀 때 카드를 통째로 스켈레톤으로 바꾸지 않습니다 — 숫자 카드 두 개와 잔디가 한꺼번에 깜빡이면
 * 무엇이 바뀌었는지 오히려 안 보입니다. 새 기록이 올 때까지 이전 기록을 흐리게 두고(`isStale`) 오면 바꿉니다.
 */
export function usePracticeRecord(period: PracticePeriod): UsePracticeRecordResult {
  const [loaded, setLoaded] = useState<PracticeRecord | null>(null)
  const [failed, setFailed] = useState<{ period: PracticePeriod; error: ApiError } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getPracticeRecord(period)
      .then((record) => {
        if (cancelled) return
        setLoaded(record)
        setFailed(null)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('연습 기록 조회 실패 period=%s code=%s', period, apiError.code)
        setFailed({ period, error: apiError })
      })

    return () => {
      cancelled = true
    }
  }, [period, attempt])

  const retry = useCallback(() => {
    setFailed(null)
    setAttempt((value) => value + 1)
  }, [])

  return {
    record: loaded,
    isStale: loaded !== null && loaded.period !== period,
    error: failed?.period === period ? failed.error : null,
    retry,
  }
}
