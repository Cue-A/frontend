import { useEffect, useId, useRef } from 'react'

import Button from '@/shared/ui/Button'

import { useDeleteCalendarEvent } from '../hooks/useDeleteCalendarEvent'
import { spokenDate } from '../lib/calendarDate'
import type { CalendarEvent } from '../types/growth'

type Props = {
  event: CalendarEvent
  /** 지운 뒤(이미 없던 일정 포함). 캘린더에서 빼고 알림을 띄우는 건 화면이 합니다 */
  onDeleted: (event: CalendarEvent) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/**
 * 면접 일정을 지우기 전에 한 번 묻습니다 (이슈 #190 — 확인 창을 따로 띄우기로 정함).
 *
 * 그날 일정 보기 창(`EventDetailDialog`) 위에 뜹니다. 지운 일정은 되돌릴 수 없어서, 로그아웃 · 북마크 해제와 같은
 * 모양의 확인 창으로 묻습니다 (`LogoutConfirmDialog` · `BookmarkRemoveDialog`).
 *
 * - 창을 열면 포커스가 "취소" 에 있습니다. Enter 한 번으로 지워지지 않게 합니다
 * - 지우는 동안은 닫을 수 없습니다. 요청을 끊을 방법이 없어서, 닫혀도 서버에서는 지워집니다
 * - 실패하면 창을 닫지 않고 이유를 보여줍니다. 다시 누를 수 있습니다
 */
export default function EventDeleteDialog({ event, onDeleted, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const { remove, deleting, error } = useDeleteCalendarEvent()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // Esc 를 연달아 누르면 브라우저가 cancel 을 막아도 창을 닫을 때가 있어서, 지우는 동안은 키 자체를 막습니다
  useEffect(() => {
    if (!deleting) return

    const blockEscape = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') keyEvent.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [deleting])

  const close = () => {
    if (!deleting) dialogRef.current?.close()
  }

  const handleDelete = async () => {
    if (!(await remove(event.eventId))) return
    onDeleted(event)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(cancel) => {
        if (deleting) cancel.preventDefault()
      }}
      aria-labelledby={headingId}
      className="m-auto w-full max-w-md rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <div className="flex flex-col gap-3 px-6 py-5">
        <p id={headingId} className="text-h2 text-neutral-900">
          일정을 삭제할까요?
        </p>
        <p className="break-keep text-body-md text-neutral-500">
          ‘<span className="font-semibold text-neutral-900">{event.title}</span>’ · {spokenDate(event.date)}
          {event.time && ` ${event.time}`}
        </p>
        <p className="break-keep text-body-md text-neutral-500">
          {event.memo ? '삭제한 일정은 되돌릴 수 없고 메모도 함께 지워져요.' : '삭제한 일정은 되돌릴 수 없어요.'}
        </p>

        {error && (
          <p role="alert" className="break-keep text-body-sm text-semantic-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4">
        <Button size="sm" onClick={close} disabled={deleting}>
          취소
        </Button>
        <Button variant="primary" size="sm" onClick={() => void handleDelete()} disabled={deleting}>
          {deleting ? '삭제하는 중…' : '삭제'}
        </Button>
      </div>
    </dialog>
  )
}
