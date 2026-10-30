import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react'
import { useId } from 'react'

import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import type { UseCalendarMonthResult } from '../hooks/useCalendarMonth'
import { dayOf, monthLabel, shiftMonth, shortDate, spokenDate, weeksOf, WEEKDAYS } from '../lib/calendarDate'
import type { CalendarEvent } from '../types/growth'

import GrowthCardHeader from './GrowthCardHeader'

type Props = {
  /** 보고 있는 달 (YYYY-MM) */
  month: string
  /** 오늘 (YYYY-MM-DD) */
  today: string
  calendar: UseCalendarMonthResult
  onMonthChange: (month: string) => void
  onAddEvent: () => void
}

const NAV_BUTTON =
  'flex h-8 w-8 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary-500'

/** 범례 한 칸. 시안은 회색 점 셋인데, 무엇이 무엇인지 보이도록 캘린더 칸과 같은 색을 씁니다 */
function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-4 text-body-sm text-neutral-400">
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary-500" />
        면접 일정
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary-400" />
        연습 완료
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-primary-500" />
        오늘
      </li>
    </ul>
  )
}

type DayMarks = { today: boolean; practiced: boolean; eventCount: number }

/** 날짜 칸 하나. 오늘은 보라 원, 연습한 날은 연보라 글자, 면접 일정이 있는 날은 보라 글자 + 점입니다 (시안 week-1) */
function DayCell({ date, marks }: { date: string; marks: DayMarks }) {
  const spoken = [
    spokenDate(date),
    marks.today && '오늘',
    marks.eventCount > 0 && `면접 일정 ${marks.eventCount}개`,
    marks.practiced && '연습 완료',
  ]
    .filter(Boolean)
    .join(', ')

  const numberClass = marks.today
    ? 'bg-primary-500 text-neutral-0'
    : marks.eventCount > 0
      ? 'font-semibold text-primary-500'
      : marks.practiced
        ? 'text-primary-400'
        : 'text-neutral-700'

  return (
    <td className="h-11 p-0 text-center">
      <span aria-hidden className="inline-flex items-center gap-1">
        <span className={`flex h-7.5 w-7.5 items-center justify-center rounded-full text-body-md ${numberClass}`}>
          {dayOf(date)}
        </span>
        {marks.eventCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />}
      </span>
      <span className="sr-only">{spoken}</span>
    </td>
  )
}

/** 이 달의 면접 일정 목록. 캘린더 칸에는 점만 찍혀서 무슨 일정인지 보이지 않아 아래에 적습니다 */
function EventList({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return <p className="text-body-sm text-neutral-400">이 달에 등록한 면접 일정이 없어요.</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event) => (
        <li key={event.eventId} className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="shrink-0 whitespace-nowrap text-body-sm font-semibold text-primary-500">
            {shortDate(event.date)}
            {event.time && ` ${event.time}`}
          </span>
          <span className="min-w-0 text-body-md text-neutral-900">{event.title}</span>
          {event.memo && <span className="min-w-0 truncate text-body-sm text-neutral-500">{event.memo}</span>}
        </li>
      ))}
    </ul>
  )
}

/**
 * 면접 캘린더 (시안 card-calendar).
 *
 * - **면접 일정**은 사용자가 "+ 일정 등록" 으로 직접 넣은 것입니다.
 * - **연습 완료**는 연습한 날(연속 기록)에서 자동으로 찍힙니다. 시안의 일정 등록 창에는 "연습 완료" 유형도 있었지만,
 *   손으로 넣으면 실제 연습 기록과 따로 놀아서 뺐습니다.
 *
 * 앞 달 · 다음 달로 넘길 수 있습니다(시안에 없어 제목 옆에 화살표를 둡니다). 넘기는 동안 이전 달을 흐리게 둡니다.
 * 날짜 칸은 표(`table`)로 그려서 화면 읽기 프로그램이 요일과 함께 읽습니다. 칸마다 "8월 14일 금요일, 면접 일정 1개" 처럼
 * 한 문장을 따로 붙입니다.
 */
export default function InterviewCalendarCard({ month, today, calendar, onMonthChange, onAddEvent }: Props) {
  const captionId = useId()
  const previousMonth = shiftMonth(month, -1)
  const nextMonth = shiftMonth(month, 1)
  const ready = calendar.status === 'ready' ? calendar : null
  const events = ready?.updating ? [] : (ready?.calendar.events ?? [])
  const practiced = new Set(ready?.updating ? [] : (ready?.calendar.practicedDates ?? []))

  const marksOf = (date: string): DayMarks => ({
    today: date === today,
    practiced: practiced.has(date),
    eventCount: events.filter((event) => event.date === date).length,
  })

  return (
    <Card label="면접 캘린더" padding="lg">
      <GrowthCardHeader
        title={`${monthLabel(month)} · 면접 캘린더`}
        note={
          <span className="flex items-center gap-1">
            <button type="button" onClick={() => onMonthChange(previousMonth)} className={NAV_BUTTON}>
              <IconChevronLeft size={16} stroke={2} aria-hidden />
              <span className="sr-only">이전 달 ({monthLabel(previousMonth)})</span>
            </button>
            <button type="button" onClick={() => onMonthChange(nextMonth)} className={NAV_BUTTON}>
              <IconChevronRight size={16} stroke={2} aria-hidden />
              <span className="sr-only">다음 달 ({monthLabel(nextMonth)})</span>
            </button>
          </span>
        }
        aside={
          <button
            type="button"
            onClick={onAddEvent}
            className="inline-flex shrink-0 items-center gap-1 rounded-xs text-body-md text-primary-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            <IconPlus size={14} stroke={2} aria-hidden />
            일정 등록
          </button>
        }
      />

      <div className="mt-2">
        <Legend />
      </div>

      {calendar.status === 'error' && (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-body-sm text-semantic-danger">
            이 달의 일정을 불러오지 못했어요. {toUserMessage(calendar.error.code)}
          </p>
          <Button size="sm" onClick={calendar.reload}>
            다시 시도
          </Button>
        </div>
      )}

      <table
        aria-labelledby={captionId}
        aria-busy={calendar.status === 'loading' || ready?.updating || undefined}
        className={`mt-6 w-full table-fixed border-collapse transition-opacity ${
          calendar.status === 'loading' || ready?.updating ? 'opacity-60' : ''
        }`}
      >
        <caption id={captionId} className="sr-only">
          {monthLabel(month)} 면접 캘린더
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map((weekday, index) => (
              <th
                key={weekday}
                scope="col"
                className={`h-6 text-body-sm font-semibold ${index === 0 ? 'text-semantic-danger' : 'text-neutral-500'}`}
              >
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeksOf(month).map((week) => (
            <tr key={week.find(Boolean) ?? ''}>
              {week.map((date, index) =>
                date ? <DayCell key={date} date={date} marks={marksOf(date)} /> : <td key={`empty-${index}`} />,
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5 border-t border-neutral-200 pt-5">
        <h3 className="sr-only">{monthLabel(month)} 면접 일정</h3>
        {calendar.status === 'loading' || ready?.updating ? (
          <p aria-busy className="text-body-sm text-neutral-400">
            일정을 불러오는 중이에요…
          </p>
        ) : ready ? (
          <EventList events={events} />
        ) : null}
      </div>
    </Card>
  )
}
