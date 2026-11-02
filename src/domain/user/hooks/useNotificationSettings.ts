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
      /** 한 항목만 바꿉니다. 실패하면 그 항목만 되돌리고 `actionError` 에 이유를 둡니다 */
      toggle: (key: keyof NotificationSettings, value: boolean) => void
      /** 마지막 변경이 실패한 이유. 사용자에게 그대로 보여줄 문구입니다 */
      actionError: string | null
    }

function codeOf(cause: unknown) {
  return cause instanceof ApiError ? cause.code : 'UNKNOWN'
}

/**
 * 마이페이지 > 알림 설정. API 명세서에 없는 임시 API 라 목업 전용입니다 (userApi.ts 주석 · Q16).
 *
 * 켜고 끄기는 기다리지 않고 먼저 바꿉니다(낙관적 업데이트). 실패하면 **바꾼 항목만** 되돌립니다 — 누른 순간의 설정
 * 통째로 되돌리면, 둘을 연달아 바꾼 뒤 앞의 것만 실패해도 뒤의 것까지 되돌아갑니다. (PR #112 리뷰)
 *
 * 보내는 값은 바뀐 항목 하나입니다. 전체를 보내면 앞의 요청이 늦게 도착했을 때 뒤에서 바꾼 값을 덮어씁니다.
 */
export function useNotificationSettings(): UseNotificationSettingsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getNotificationSettings()
      .then((settings) => {
        if (!cancelled) setState({ status: 'ready', settings })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        console.error('알림 설정 조회 실패 code=%s', codeOf(cause))
        setState({ status: 'error', error: toUserMessage(codeOf(cause)) })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback((key: keyof NotificationSettings, value: boolean) => {
    const patchKey = (next: boolean) => (previous: State): State =>
      previous.status === 'ready' ? { status: 'ready', settings: { ...previous.settings, [key]: next } } : previous

    setActionError(null)
    setState(patchKey(value))

    updateNotificationSettings({ [key]: value }).catch((cause: unknown) => {
      console.error('알림 설정 수정 실패 code=%s', codeOf(cause))
      setActionError(`설정을 바꾸지 못했어요. ${toUserMessage(codeOf(cause))}`)
      setState(patchKey(!value))
    })
  }, [])

  if (state.status !== 'ready') return state
  return { ...state, toggle, actionError }
}
