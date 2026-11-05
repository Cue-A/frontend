import { IconX } from '@tabler/icons-react'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import Button from '@/shared/ui/Button'

import { useCreateCalendarEvent } from '../hooks/useCreateCalendarEvent'
import { MAX_EVENT_MEMO_LENGTH, MAX_EVENT_TITLE_LENGTH } from '../lib/growthDisplay'
import type { CalendarEvent } from '../types/growth'

type Props = {
  /** 날짜 칸에 처음 넣어 둘 날 (YYYY-MM-DD) */
  defaultDate: string
  onCreated: (event: CalendarEvent) => void
  /** 창이 닫힌 뒤. 어떤 경로로 닫혀도 여기로 한 번 옵니다 */
  onClose: () => void
}

const LABEL_CLASS = 'text-body-sm font-semibold text-neutral-700'

/**
 * 날짜 칸이 받는 범위. 브라우저에 따라 연도 칸에 6자리까지 들어가서(`+020260-…`) 달 계산(`monthOf`)이 깨집니다.
 * 칸에 범위를 걸고, 값도 4자리 연도 형식인지 한 번 더 봅니다 — 범위는 직접 타이핑하면 넘길 수 있습니다. (PR #137 리뷰)
 */
const DATE_MIN = '2000-01-01'
const DATE_MAX = '2099-12-31'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const isValidDate = (value: string) => DATE_PATTERN.test(value) && value >= DATE_MIN && value <= DATE_MAX
const FIELD_CLASS =
  'w-full rounded-sm border border-neutral-300 bg-neutral-0 px-4 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none read-only:bg-neutral-50'

/** 조합 표시를 단 채로 온 Enter 는 폼 제출로 넘기지 않습니다 (DocumentRenameDialog 주석 참고) */
function blockComposingEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) {
    event.preventDefault()
  }
}

/**
 * 면접 일정 등록 창 (시안 Modal-일정등록).
 *
 * 시안의 "일정 유형(면접 일정 / 연습 완료)" 은 뺐습니다. 연습 기록은 면접을 보면 자동으로 쌓이는 값이라 손으로 넣으면
 * 실제 기록과 어긋납니다 — 이 창은 면접 일정만 넣고, 캘린더의 "연습 완료" 는 연습한 날에서 자동으로 찍힙니다.
 *
 * 제목 · 날짜는 꼭 적고, 시간 · 메모는 비워도 됩니다. 동작은 보관함의 창들(문서 제목 수정 · 새 폴더)과 같습니다 —
 * Enter 로 등록, 한글 조합 중 Enter 무시, 등록하는 동안 닫기 · 입력 잠금, 실패하면 창을 두고 이유를 보여주기.
 */
export default function EventCreateDialog({ defaultDate, onCreated, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const titleRef = useRef<HTMLInputElement | null>(null)
  const headingId = useId()
  const descriptionId = useId()
  const hintId = useId()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState('')
  const [memo, setMemo] = useState('')
  const { create, creating, error, clearError } = useCreateCalendarEvent()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!creating) return

    const blockEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault()
    }
    window.addEventListener('keydown', blockEscape, true)
    return () => window.removeEventListener('keydown', blockEscape, true)
  }, [creating])

  const close = () => {
    if (!creating) dialogRef.current?.close()
  }

  const trimmedTitle = title.trim()
  const trimmedMemo = memo.trim()

  // 처음 연 빈 칸은 틀린 게 아니라서 빨간 글씨로 쓰지 않습니다.
  const invalidDate = date !== '' && !isValidDate(date)
  const blockReason = !trimmedTitle
    ? '일정 제목을 적으면 등록할 수 있어요.'
    : !date
      ? '날짜를 골라 주세요.'
      : invalidDate
        ? '날짜를 다시 확인해 주세요. 2000년부터 2099년까지 고를 수 있어요.'
        : null
  const canSubmit = blockReason === null && !creating

  const edit = (apply: () => void) => {
    clearError()
    apply()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const created = await create({ title: trimmedTitle, date, time: time || null, memo: trimmedMemo || null })
    if (!created) {
      titleRef.current?.focus()
      return
    }

    onCreated(created)
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (creating) event.preventDefault()
      }}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      className="m-auto w-full max-w-120 rounded-lg bg-neutral-0 p-0 shadow-float backdrop:bg-neutral-900/40"
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-6 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p id={headingId} className="text-h2 font-bold text-neutral-900">
              일정 등록
            </p>
            <p id={descriptionId} className="text-body-md text-neutral-500">
              새로운 면접 일정을 캘린더에 추가해요
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={creating}
            className="rounded-xs p-1 text-neutral-500 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            <IconX size={20} stroke={2} aria-hidden />
            <span className="sr-only">닫기</span>
          </button>
        </div>

        <label className="flex flex-col gap-2">
          <span className={LABEL_CLASS}>일정 제목</span>
          <input
            ref={titleRef}
            type="text"
            value={title}
            placeholder="예: 네이버 1차 면접"
            onChange={(event) => edit(() => setTitle(event.target.value))}
            onKeyDown={blockComposingEnter}
            maxLength={MAX_EVENT_TITLE_LENGTH}
            readOnly={creating}
            aria-describedby={hintId}
            className={`${FIELD_CLASS} h-12`}
          />
        </label>

        <div className="flex gap-4">
          <label className="flex min-w-0 flex-1 flex-col gap-2">
            <span className={LABEL_CLASS}>날짜</span>
            <input
              type="date"
              value={date}
              onChange={(event) => edit(() => setDate(event.target.value))}
              readOnly={creating}
              required
              min={DATE_MIN}
              max={DATE_MAX}
              aria-invalid={invalidDate || undefined}
              aria-describedby={hintId}
              className={`${FIELD_CLASS} h-12`}
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-2">
            <span className={LABEL_CLASS}>
              시간 <span className="font-normal text-neutral-400">(선택)</span>
            </span>
            <input
              type="time"
              value={time}
              onChange={(event) => edit(() => setTime(event.target.value))}
              readOnly={creating}
              className={`${FIELD_CLASS} h-12`}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between">
            <span className={LABEL_CLASS}>메모 (선택)</span>
            <span className="text-body-sm text-neutral-400">
              {trimmedMemo.length}/{MAX_EVENT_MEMO_LENGTH}
            </span>
          </span>
          <textarea
            value={memo}
            placeholder="면접 준비 시 참고할 메모를 남겨보세요"
            onChange={(event) => edit(() => setMemo(event.target.value))}
            maxLength={MAX_EVENT_MEMO_LENGTH}
            readOnly={creating}
            rows={3}
            className={`${FIELD_CLASS} h-20 resize-none py-3`}
          />
        </label>

        {/* 줄 수가 바뀌어도 창 높이가 흔들리지 않게 자리를 늘 잡아둡니다 */}
        <div className="-mt-2 flex min-h-5 flex-col gap-1">
          {/* 빈 칸은 틀린 게 아니라 회색, 잘못 적은 날짜는 빨간 글씨입니다 */}
          <p
            id={hintId}
            className={`break-keep text-body-sm ${invalidDate && trimmedTitle ? 'text-semantic-danger' : 'text-neutral-500'}`}
          >
            {blockReason ?? ' '}
          </p>
          {error && (
            <p role="alert" className="break-keep text-body-sm text-semantic-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={close} disabled={creating} className="flex-1">
            취소
          </Button>
          <Button variant="primary" type="submit" disabled={!canSubmit} className="flex-1">
            {creating ? '등록하는 중…' : '등록하기'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
