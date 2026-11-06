import { IconClock, IconNote, IconPencil, IconTrash, IconX } from '@tabler/icons-react'
import { useEffect, useId, useRef, useState } from 'react'

import Button from '@/shared/ui/Button'

import { spokenDate } from '../lib/calendarDate'
import type { CalendarEvent } from '../types/growth'

import EventDeleteDialog from './EventDeleteDialog'

type Props = {
  /** 보고 있는 날 (YYYY-MM-DD) */
  date: string
  /** 그날의 일정. 캘린더가 들고 있는 값을 그대로 받아서, 고치거나 지우면 바로 바뀝니다 */
  events: CalendarEvent[]
  /** "수정" — 이 창을 닫고 수정 창을 엽니다 */
  onEdit: (event: CalendarEvent) => void
  /** 지운 뒤. 캘린더에서 빼고 알림을 띄우는 건 화면이 합니다 */
  onDeleted: (event: CalendarEvent) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

/** 일정 한 칸 — 제목 · 시간 · 메모와 수정 · 삭제 버튼 */
function EventItem({
  event,
  onEdit,
  onAskDelete,
}: {
  event: CalendarEvent
  onEdit: () => void
  onAskDelete: () => void
}) {
  return (
    <li className="flex flex-col gap-3 rounded-md bg-surface-muted p-4">
      <div className="flex flex-col gap-1.5">
        <p className="break-keep text-body-lg font-semibold text-neutral-900">{event.title}</p>
        <p className="flex items-center gap-1.5 text-body-sm text-neutral-500">
          <IconClock size={14} stroke={2} aria-hidden />
          {event.time ?? '시간 미정'}
        </p>
        {event.memo && (
          <p className="flex items-start gap-1.5 text-body-sm text-neutral-700">
            <IconNote size={14} stroke={2} aria-hidden className="mt-0.5 shrink-0 text-neutral-500" />
            <span className="whitespace-pre-line break-keep">{event.memo}</span>
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={onEdit}>
          <IconPencil size={14} stroke={2} aria-hidden />
          수정
        </Button>
        <Button size="sm" onClick={onAskDelete}>
          <IconTrash size={14} stroke={2} aria-hidden />
          삭제
        </Button>
      </div>
    </li>
  )
}

/**
 * 그날 면접 일정 보기 — 제목 · 시간 · 메모를 보고, 고치거나 지웁니다 (이슈 #190).
 *
 * 캘린더의 날짜 칸이나 아래 일정 목록을 누르면 열립니다. 하루에 일정이 여럿일 수 있어서 한 개가 아니라 **그날 일정 전부**를
 * 보여줍니다. 시안이 없어 등록 창과 같은 판 모양을 따랐습니다.
 *
 * - "수정" 은 이 창을 닫고 등록 창을 수정 모드로 엽니다(`EventFormDialog`)
 * - "삭제" 는 이 창 위에 확인 창(`EventDeleteDialog`)을 따로 띄워 한 번 더 묻습니다. 취소하면 이 창으로 돌아옵니다
 * - 그날 일정을 다 지우면 화면이 창을 닫습니다
 */
export default function EventDetailDialog({ date, events, onEdit, onDeleted, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    // 창 자체에 포커스를 둡니다. 첫 버튼이 "수정" 이라 거기 두면 Enter 한 번에 수정 창으로 넘어갑니다
    dialog?.focus()
  }, [])

  // 확인 창이 닫히면 브라우저가 "삭제" 버튼으로 포커스를 돌려줍니다. 그 일정을 지워서 버튼이 없어졌으면 이 창으로 돌립니다
  const handleDeleteDialogClose = () => {
    setDeleteTarget(null)
    const dialog = dialogRef.current
    if (dialog?.open && !dialog.contains(document.activeElement)) dialog.focus()
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        tabIndex={-1}
        onClose={onClose}
        aria-labelledby={headingId}
        className="m-auto w-full max-w-120 rounded-lg bg-neutral-0 p-0 shadow-float outline-none backdrop:bg-neutral-900/40"
      >
        <div className="flex flex-col gap-6 p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p id={headingId} className="text-h2 font-bold text-neutral-900">
                {spokenDate(date)}
              </p>
              <p className="text-body-md text-neutral-500">면접 일정 {events.length}개</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-xs p-1 text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary-500"
            >
              <IconX size={20} stroke={2} aria-hidden />
              <span className="sr-only">닫기</span>
            </button>
          </div>

          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <EventItem
                key={event.eventId}
                event={event}
                onEdit={() => onEdit(event)}
                onAskDelete={() => setDeleteTarget(event)}
              />
            ))}
          </ul>
        </div>
      </dialog>

      {/* 보기 창(<dialog>) 밖에 둡니다. 안에 두면 확인 창의 close 이벤트가 React 트리를 타고 보기 창의 onClose 까지 올라갈 수 있습니다 */}
      {deleteTarget && (
        <EventDeleteDialog event={deleteTarget} onDeleted={onDeleted} onClose={handleDeleteDialogClose} />
      )}
    </>
  )
}
