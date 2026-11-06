import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { deleteCalendarEvent } from '../api/growthApi'

export type UseDeleteCalendarEventResult = {
  /** 지웠으면 true, 실패하면 false(`error` 에 문구) */
  remove: (eventId: string) => Promise<boolean>
  /** 지우는 중인 일정. 그 일정의 버튼만 잠급니다 */
  deletingId: string | null
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  clearError: () => void
}

/**
 * 면접 일정을 지웁니다. (`DELETE /api/calendar/events/{id}` — 이슈 #190, Cue-A/backend#133 리뷰 중이라 지금은 목업이 답합니다)
 *
 * 이미 지워진 일정(`CALENDAR_EVENT_NOT_FOUND`)도 화면에서는 빼야 해서, 그때는 지운 것으로 봅니다. 서버는 다시 지우면
 * 404 를 줍니다(멱등하지 않음).
 */
export function useDeleteCalendarEvent(): UseDeleteCalendarEventResult {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const remove = useCallback(async (eventId: string) => {
    setDeletingId(eventId)
    setError(null)

    try {
      await deleteCalendarEvent(eventId)
      return true
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
      if (code === 'CALENDAR_EVENT_NOT_FOUND') return true
      console.error('면접 일정 삭제 실패 code=%s', code)
      setError(toUserMessage(code))
      return false
    } finally {
      setDeletingId(null)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { remove, deletingId, error, clearError }
}
