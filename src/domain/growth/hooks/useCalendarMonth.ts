import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'

import { getCalendarMonth } from '../api/growthApi'
import type { CalendarMonth } from '../types/growth'

export type UseCalendarMonthResult = (
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | {
      status: 'ready'
      calendar: CalendarMonth
      /** 다른 달로 넘겨서 새 달을 받는 중인지. 받는 동안 **이전 달을 흐리게 그대로 둡니다** — 칸이 비었다 차면 깜빡입니다 */
      updating: boolean
    }
) & {
  /** 오류 안내의 "다시 시도" 에 씁니다 */
  reload: () => void
  /** 화면을 그대로 둔 채 뒤에서 다시 받습니다. 일정을 등록한 직후에 씁니다 */
  refresh: () => void
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError; month: string }
  | { status: 'ready'; calendar: CalendarMonth }

/**
 * 면접 캘린더 한 달치(면접 일정 · 연습한 날)입니다. 달이 바뀌면 다시 받습니다.
 * (`GET /api/calendar?month=YYYY-MM` — 백엔드에 없어 목업이 답합니다)
 *
 * 늦게 온 응답이 새 달을 덮지 않게, 달이 바뀌면 앞선 요청의 결과는 버립니다. 오류가 난 뒤 달을 바꾸면 새 응답이 올 때까지
 * 불러오는 중으로 둡니다 — 앞 달의 오류 안내가 남아 있으면 새 달도 실패한 것처럼 읽힙니다. (연습 기록 목록과 같은 방식)
 */
export function useCalendarMonth(month: string): UseCalendarMonthResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    getCalendarMonth(month)
      .then((calendar) => {
        if (!cancelled) setState({ status: 'ready', calendar })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', '알 수 없는 오류가 발생했어요.')
        console.error('면접 캘린더 조회 실패 month=%s code=%s', month, apiError.code)
        setState({ status: 'error', error: apiError, month })
      })

    return () => {
      cancelled = true
    }
  }, [month, attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  const refresh = useCallback(() => setAttempt((value) => value + 1), [])

  if (state.status === 'ready') {
    return { status: 'ready', calendar: state.calendar, updating: state.calendar.month !== month, reload, refresh }
  }
  if (state.status === 'error' && state.month === month) {
    return { status: 'error', error: state.error, reload, refresh }
  }
  return { status: 'loading', reload, refresh }
}
