import { useCallback, useEffect, useRef, useState } from 'react'

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
      /** 한 항목만 바꿉니다. 실패하면 그 항목만 서버가 마지막으로 받아 준 값으로 되돌리고 `actionError` 에 이유를 둡니다 */
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
 *
 * 되돌리는 값은 `!value` 가 아니라 **서버가 마지막으로 받아 준 값**이고, 그 항목의 요청이 전부 끝난 뒤에 한 번만 맞춥니다.
 * 같은 항목을 빠르게 켰다 껐다 하면 요청이 둘 이상 겹치는데, `!value` 로 되돌리면 앞 요청만 실패했을 때 화면이
 * 뒤에서 고른 값과 반대로 뒤집힙니다. 요청이 남아 있는 동안은 마지막으로 누른 값을 그대로 보여줍니다. (PR #166 리뷰)
 */
export function useNotificationSettings(): UseNotificationSettingsResult {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [actionError, setActionError] = useState<string | null>(null)
  /** 서버가 마지막으로 받아 준 설정. 처음엔 조회 값이고, 수정이 성공할 때마다 그 항목을 옮깁니다 */
  const confirmed = useRef<NotificationSettings | null>(null)
  /** 항목별로 아직 끝나지 않은 수정 요청 수 */
  const pending = useRef<Partial<Record<keyof NotificationSettings, number>>>({})
  /** 요청마다 붙이는 번호와, 항목별로 `confirmed` 에 반영한 마지막 번호. 늦게 온 앞 요청의 성공이 뒤 요청의 성공을 덮지 않게 합니다 */
  const sequence = useRef(0)
  const confirmedSequence = useRef<Partial<Record<keyof NotificationSettings, number>>>({})
  /** 항목별로 마지막에 누른 값, 그리고 지금 `actionError` 가 어느 항목의 실패인지 */
  const wanted = useRef<Partial<NotificationSettings>>({})
  const failedKey = useRef<keyof NotificationSettings | null>(null)

  useEffect(() => {
    let cancelled = false

    getNotificationSettings()
      .then((settings) => {
        if (cancelled) return
        confirmed.current = settings
        setState({ status: 'ready', settings })
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
    failedKey.current = null
    setState(patchKey(value))
    wanted.current[key] = value
    pending.current[key] = (pending.current[key] ?? 0) + 1
    sequence.current += 1
    const id = sequence.current

    updateNotificationSettings({ [key]: value })
      .then(() => {
        if (!confirmed.current || id < (confirmedSequence.current[key] ?? 0)) return
        confirmed.current = { ...confirmed.current, [key]: value }
        confirmedSequence.current[key] = id
      })
      .catch((cause: unknown) => {
        console.error('알림 설정 수정 실패 code=%s', codeOf(cause))
        setActionError(`설정을 바꾸지 못했어요. ${toUserMessage(codeOf(cause))}`)
        failedKey.current = key
      })
      .finally(() => {
        const left = (pending.current[key] ?? 1) - 1
        pending.current[key] = left
        // 이 항목의 요청이 다 끝났을 때만 서버가 받아 준 값에 맞춥니다. 마지막 요청이 성공했다면 이미 같은 값이라 그대로입니다
        if (left !== 0 || !confirmed.current) return
        const settled = confirmed.current[key]
        setState(patchKey(settled))
        // 앞 요청만 실패하고 마지막에 누른 값은 저장됐다면, 실패 문구는 이제 맞지 않아서 지웁니다
        if (failedKey.current === key && settled === wanted.current[key]) {
          failedKey.current = null
          setActionError(null)
        }
      })
  }, [])

  if (state.status !== 'ready') return state
  return { ...state, toggle, actionError }
}
