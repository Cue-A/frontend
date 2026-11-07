import { useCallback, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { createCalendarEvent, updateCalendarEvent } from '../api/growthApi'
import type { CalendarEvent, CalendarEventDraft } from '../types/growth'

export type UseSaveCalendarEventResult = {
  /**
   * 등록하거나 고친 일정, 실패하면 null(`error` 에 문구). 고치려던 일정이 이미 없으면(다른 탭에서 지움) `'gone'` 입니다 —
   * 다시 눌러도 같은 결과라 문구 대신 화면이 캘린더에서 빼고 창을 닫습니다
   */
  save: (draft: CalendarEventDraft) => Promise<CalendarEvent | 'gone' | null>
  saving: boolean
  /** 사용자에게 그대로 보여줄 문구 */
  error: string | null
  /** 실패 문구를 지웁니다. 입력을 다시 고치기 시작하면 부릅니다 */
  clearError: () => void
}

/**
 * 면접 일정을 등록하거나 고칩니다. `eventId` 가 없으면 등록(`POST /api/calendar/events`), 있으면 그 일정 수정
 * (`PUT /api/calendar/events/{id}`, 이슈 #190) 입니다. 백엔드는 Cue-A/backend#133 에서 리뷰 중이라 지금은 목업이 답합니다.
 */
export function useSaveCalendarEvent(eventId: string | null = null): UseSaveCalendarEventResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(
    async (draft: CalendarEventDraft): Promise<CalendarEvent | 'gone' | null> => {
      setSaving(true)
      setError(null)

      try {
        return eventId ? await updateCalendarEvent(eventId, draft) : await createCalendarEvent(draft)
      } catch (cause) {
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        if (eventId && code === 'CALENDAR_EVENT_NOT_FOUND') return 'gone'
        // 제목 · 메모는 남기지 않습니다. 회사 이름 · 개인 메모가 들어갑니다. 길이와 코드만 남깁니다.
        console.error('면접 일정 %s 실패 titleLength=%d code=%s', eventId ? '수정' : '등록', draft.title.length, code)
        setError(toUserMessage(code))
        return null
      } finally {
        setSaving(false)
      }
    },
    [eventId],
  )

  const clearError = useCallback(() => setError(null), [])

  return { save, saving, error, clearError }
}
