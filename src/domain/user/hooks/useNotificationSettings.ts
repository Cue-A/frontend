import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getNotificationSettings, updateNotificationSettings } from '../api/userApi'
import type { NotificationSettings } from '../types/user'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; settings: NotificationSettings }

export type UseNotificationSettingsResult =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | {
      status: 'ready'
      settings: NotificationSettings
      /** 한 항목만 바꿉니다. 실패하면 되돌립니다. */
      toggle: (key: keyof NotificationSettings, value: boolean) => void
    }

/** B-03 마이페이지/알림설정. 명세서에 없는 임시 API 라 목업 전용입니다 (userApi.ts 주석 참고). */
export function useNotificationSettings(): UseNotificationSettingsResult {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    getNotificationSettings()
      .then((settings) => {
        if (!cancelled) setState({ status: 'ready', settings })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('알림 설정 조회 실패 code=%s', code)
        setState({ status: 'error', error: toUserMessage(code) })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback(
    (key: keyof NotificationSettings, value: boolean) => {
      if (state.status !== 'ready') return
      const previous = state.settings
      const next = { ...previous, [key]: value }

      setState({ status: 'ready', settings: next })

      updateNotificationSettings(next).catch((cause: unknown) => {
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('알림 설정 수정 실패 code=%s', code)
        setState({ status: 'ready', settings: previous })
      })
    },
    [state],
  )

  if (state.status !== 'ready') return state
  return { ...state, toggle }
}
