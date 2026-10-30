import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createCalendarEvent } from '../api/growthApi'
import type { CalendarEvent, CalendarEventDraft } from '../types/growth'

export type UseCreateCalendarEventResult = {
  /** 등록한 일정, 실패하면 null(`error` 에 문구) */
  create: (draft: CalendarEventDraft) => Promise<CalendarEvent | null>
  creating: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  /** 실패 문구를 지웁니다. 입력을 다시 고치기 시작하면 부릅니다 */
  clearError: () => void
}

/** 면접 일정을 등록합니다. (`POST /api/calendar/events` — 백엔드에 없어 목업이 답합니다) */
export function useCreateCalendarEvent(): UseCreateCalendarEventResult {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (draft: CalendarEventDraft) => {
    setCreating(true)
    setError(null)

    try {
      return await createCalendarEvent(draft)
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      // 제목 · 메모는 남기지 않습니다. 회사 이름 · 개인 메모가 들어갑니다. 길이와 코드만 남깁니다.
      console.error('면접 일정 등록 실패 titleLength=%d code=%s', draft.title.length, code)
      setError(toUserMessage(code))
      return null
    } finally {
      setCreating(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { create, creating, error, clearError }
}
