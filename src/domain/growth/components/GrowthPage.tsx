import { useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

import { GROWTH_CALENDAR_ID, GROWTH_OPEN_GOAL, GROWTH_OPEN_PARAM } from '@/app/routes'
import { useReportComparison } from '@/domain/report/hooks/useReportComparison'
import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useCalendarMonth } from '../hooks/useCalendarMonth'
import { useGrowthOverview } from '../hooks/useGrowthOverview'
import { useLatestInterview } from '../hooks/useLatestInterview'
import { monthOf, shortDate, toDateKey, toMonthKey } from '../lib/calendarDate'
import type { CalendarEvent } from '../types/growth'

import BadgesCard from './BadgesCard'
import EventDetailDialog from './EventDetailDialog'
import EventFormDialog from './EventFormDialog'
import GoalEditDialog from './GoalEditDialog'
import GrowthTopBar from './GrowthTopBar'
import InterviewCalendarCard from './InterviewCalendarCard'
import RoundChangeCard from './RoundChangeCard'
import ScoreRoundsCard from './ScoreRoundsCard'
import WeeklyGoalCard from './WeeklyGoalCard'

/**
 * 열려 있는 창. 한 번에 하나만 엽니다 — 일정 보기에서 "수정" 을 누르면 보기 창을 닫고 수정 창을 엽니다 (이슈 #190).
 * - `detail` — 그날 일정 보기(제목 · 시간 · 메모, 수정 · 삭제)
 * - `edit` — 그 일정 수정. 등록 창(`event`)과 같은 창입니다
 */
type OpenDialog = 'goal' | 'event' | { kind: 'detail'; date: string } | { kind: 'edit'; event: CalendarEvent } | null

/**
 * 성장 관리 (C-04).
 *
 * 회차를 거치며 무엇이 달라졌는지(점수 추이 · 이전 회차 대비 변화)와 이번 주 목표 · 배지를 보고, 면접 일정을 관리합니다.
 *
 * 네 가지를 따로 받습니다.
 * - `useGrowthOverview` — 이번 주 목표 · 배지 (`/api/growth`, 목업)
 * - `useLatestInterview` — 가장 최근 리포트 (`/api/home/recent-reports?limit=1`, 실서버). 목표 · 배지와 따로 받아서, 이게
 *   실패하면 점수 추이 · 이전 회차 대비 변화 칸에만 오류와 "다시 시도" 를 두고 목표 · 배지는 그대로 보입니다 (PR #184 리뷰)
 * - `useReportComparison` — 그 리포트의 회차 비교(점수 추이 · 이전 회차 대비 변화). AI 가 계산해서 몇 초 걸리고 60초에
 *   10회 제한이 있어서, 목표를 고쳐 요약을 새로 받아도 리포트가 같으면 다시 부르지 않습니다
 * - `useCalendarMonth` — 캘린더 한 달치. 달을 넘길 때마다 받습니다
 *
 * 본문 폭은 시안대로 1040px 입니다 (왼쪽 688 · 오른쪽 336 · 사이 16).
 *
 * 홈에서 들어올 때 주소로 어디를 보여줄지 받습니다 (이슈 #142, `toGrowth`).
 * - `?open=goal` — 이번 주 목표 창을 엽니다(홈 "목표 수정 · 목표 정하기"). 요약을 받아 와야 창을 그릴 수 있어서 받은 뒤에
 *   열립니다. 창을 닫으면 주소에서 지웁니다 — 남겨 두면 새로고침할 때마다 창이 다시 열립니다
 * - `#calendar` — 면접 캘린더로 내려갑니다(홈 "다가오는 면접일 · 전체보기")
 *
 * **성장 관리 API 가 백엔드에 아직 배포되지 않아 목업으로만 동작합니다** (api/growthApi.ts · Cue-A/backend#132 · #133).
 * 일정이 있는 날짜 칸 · 일정 목록을 누르면 그날 일정을 보고 고치거나 지울 수 있습니다 (이슈 #190 — 전에는 등록만 됐습니다).
 */
export default function GrowthPage() {
  const overview = useGrowthOverview()
  // 자정을 넘겨도 화면을 새로 열기 전까지는 같은 "오늘" 로 둡니다. 그리는 도중 오늘이 바뀌면 칸이 어긋납니다.
  const [today] = useState(() => toDateKey(new Date()))
  const [month, setMonth] = useState(() => toMonthKey(new Date()))
  const calendar = useCalendarMonth(month)
  const [searchParams, setSearchParams] = useSearchParams()
  const { hash } = useLocation()
  const [openDialog, setOpenDialog] = useState<OpenDialog>(() =>
    searchParams.get(GROWTH_OPEN_PARAM) === GROWTH_OPEN_GOAL ? 'goal' : null,
  )
  // 저장 · 등록 알림은 그 일을 한 카드 안에 띄웁니다. 맨 위에 두면 눈에 띄지 않습니다. (PR #137 리뷰)
  const [goalNotice, setGoalNotice] = useState<string | null>(null)
  const [eventNotice, setEventNotice] = useState<string | null>(null)

  const ready = overview.status === 'ready' ? overview.overview : undefined
  const latest = useLatestInterview()
  const interview = latest.status === 'ready' ? latest.interview : undefined
  const comparison = useReportComparison(interview?.reportId ?? null)
  const interviewError =
    latest.status === 'error' ? `최근 리포트를 불러오지 못했어요. ${toUserMessage(latest.error.code)}` : null

  /*
    창을 닫은 뒤 돌아갈 자리. 보기 창에서 "수정" 을 누르면 보기 창이 사라지면서, 브라우저가 수정 창을 닫을 때 돌려줄
    포커스("수정" 버튼)도 같이 없어져 포커스가 화면 맨 앞으로 떨어집니다. 그래서 창을 연 버튼(날짜 칸 · 일정 목록 줄)을
    기억해 두고, 닫은 뒤 포커스가 갈 곳을 잃었으면 그리로 돌립니다. 그 버튼도 없어졌으면(그날 일정을 다 지웠거나 다른 달로
    옮김) 캘린더 카드로 돌립니다. (PR #191 리뷰)
  */
  const openerRef = useRef<HTMLElement | null>(null)
  const calendarRef = useRef<HTMLDivElement | null>(null)
  const rememberOpener = () => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }
  const restoreFocus = () => {
    // 닫힌 창이 빠지고 캘린더가 다시 그려진 뒤에 봅니다
    requestAnimationFrame(() => {
      const active = document.activeElement
      if (active && active !== document.body && active.isConnected) return
      const opener = openerRef.current
      if (opener?.isConnected) opener.focus()
      else calendarRef.current?.focus()
    })
  }

  // 창을 열면 앞서 남은 알림은 지웁니다
  const openGoal = () => {
    rememberOpener()
    setGoalNotice(null)
    setEventNotice(null)
    setOpenDialog('goal')
  }
  const openEvent = () => {
    rememberOpener()
    setGoalNotice(null)
    setEventNotice(null)
    setOpenDialog('event')
  }

  const closeDialog = () => {
    setOpenDialog(null)
    restoreFocus()
    if (searchParams.has(GROWTH_OPEN_PARAM)) {
      setSearchParams(
        (params) => {
          params.delete(GROWTH_OPEN_PARAM)
          return params
        },
        { replace: true },
      )
    }
  }

  /*
    캘린더 자리로 들어왔으면 그리로 내려갑니다. 라우터는 주소의 # 로 스크롤해 주지 않습니다.

    화면을 다 받은 뒤에 **한 번만** 내려갑니다. 위쪽 카드(요약 · 회차 비교)와 캘린더가 불러오는 동안은 자리 표시라 높이가
    작아서, 그때 내려가면 페이지 끝에 걸려 덜 내려가고 카드가 채워지면서 캘린더가 다시 아래로 밀립니다.
  */
  const pageSettled =
    overview.status !== 'loading' &&
    latest.status !== 'loading' &&
    comparison.status !== 'loading' &&
    calendar.status !== 'loading'
  const scrolledToCalendar = useRef(false)
  useEffect(() => {
    if (hash !== `#${GROWTH_CALENDAR_ID}` || !pageSettled || scrolledToCalendar.current) return
    scrolledToCalendar.current = true
    document.getElementById(GROWTH_CALENDAR_ID)?.scrollIntoView({ block: 'start' })
  }, [hash, pageSettled])

  // 사용자가 달을 넘기면 일정 알림을 지웁니다. 다른 달의 일정 알림이 남아 있으면 지금 보는 달 이야기로 읽힙니다.
  const changeMonth = (next: string) => {
    setEventNotice(null)
    setMonth(next)
  }

  // 같은 달이면 등록 응답을 바로 끼워 넣고(다시 받지 않음), 다른 달이면 그 달로 넘겨 새로 받습니다. 이때는 알림을 남겨 둡니다.
  const handleEventCreated = (event: CalendarEvent) => {
    setEventNotice(`‘${event.title}’ 일정을 ${shortDate(event.date)}에 등록했어요.`)
    if (monthOf(event.date) === month) calendar.addEvent(event)
    else setMonth(monthOf(event.date))
  }

  // 고친 일정도 등록과 같습니다. 다른 달로 옮겼으면 이 달에서 빼고 그 달로 넘어갑니다 — 옮긴 자리를 바로 보여주려는 것입니다
  const handleEventUpdated = (before: CalendarEvent, event: CalendarEvent) => {
    setEventNotice(
      before.date === event.date
        ? `‘${event.title}’ 일정을 고쳤어요.`
        : `‘${event.title}’ 일정을 고쳤어요. 이제 ${shortDate(event.date)}에 있어요.`,
    )
    calendar.replaceEvent(event)
    if (monthOf(event.date) !== month) setMonth(monthOf(event.date))
  }

  // 지운 일정은 이 달에서 뺍니다. 그날 일정이 더 없으면 보기 창도 닫습니다
  const handleEventDeleted = (event: CalendarEvent) => {
    setEventNotice(`‘${event.title}’ 일정을 지웠어요.`)
    calendar.removeEvent(event.eventId)
    if (!dayEvents.some((item) => item.eventId !== event.eventId)) {
      setOpenDialog(null)
      restoreFocus()
    }
  }

  // 고치려던 일정이 이미 없었습니다(다른 탭에서 지움). 저장할 수 없으니 이 달에서 빼고 알립니다
  const handleEventGone = (event: CalendarEvent) => {
    setEventNotice(`‘${event.title}’ 일정은 이미 지워져 있어요.`)
    calendar.removeEvent(event.eventId)
  }

  // 보기 창에 넣을 그날 일정. 캘린더가 들고 있는 값을 그대로 써서 고치거나 지우면 바로 바뀝니다
  const detailDate = typeof openDialog === 'object' && openDialog?.kind === 'detail' ? openDialog.date : null
  const dayEvents =
    detailDate && calendar.status === 'ready'
      ? calendar.calendar.events.filter((event) => event.date === detailDate)
      : []

  const openDate = (date: string) => {
    rememberOpener()
    setGoalNotice(null)
    setEventNotice(null)
    setOpenDialog({ kind: 'detail', date })
  }

  // 지금 보는 달이 이번 달이면 오늘을, 아니면 그 달 1일을 날짜 칸에 넣어 둡니다
  const defaultEventDate = monthOf(today) === month ? today : `${month}-01`

  return (
    <>
      <div className="mx-auto flex w-full max-w-260 flex-col gap-6">
        <GrowthTopBar />

        <div>
          <h1 className="text-h1 text-neutral-900">성장 관리</h1>
          <p className="mt-2 break-keep text-body-md text-neutral-500">
            회차를 거치며 무엇이 어떻게 달라졌는지 확인하고, 다음 면접 일정을 관리해요
          </p>
        </div>

        {overview.status === 'error' ? (
          <Card label="성장 기록" padding="lg">
            <div role="alert" className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-body-md text-neutral-900">성장 기록을 불러오지 못했어요.</p>
              <p className="text-body-sm text-neutral-500">{toUserMessage(overview.error.code)}</p>
              <Button size="sm" onClick={overview.reload} className="mt-2">
                다시 시도
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
              <ScoreRoundsCard
                interview={interview}
                comparison={comparison}
                interviewError={interviewError === null ? null : { message: interviewError, onRetry: latest.reload }}
              />
              <WeeklyGoalCard goal={ready?.weeklyGoal} notice={goalNotice} onEdit={openGoal} />
              <BadgesCard badges={ready?.badges} />
            </div>
            <RoundChangeCard interview={interview} comparison={comparison} interviewError={interviewError} />
          </>
        )}

        {/* 창을 닫은 뒤 돌아갈 버튼이 없어졌을 때 포커스를 받는 자리입니다(restoreFocus) */}
        <div ref={calendarRef} id={GROWTH_CALENDAR_ID} tabIndex={-1} className="scroll-mt-6 outline-none">
          <InterviewCalendarCard
            month={month}
            today={today}
            calendar={calendar}
            notice={eventNotice}
            onMonthChange={changeMonth}
            onAddEvent={openEvent}
            onOpenDate={openDate}
          />
        </div>
      </div>

      {openDialog === 'goal' && ready && (
        <GoalEditDialog
          goal={ready.weeklyGoal}
          onSaved={(goal) => {
            setGoalNotice(`이번 주 목표를 ${goal.target}회로 정했어요.`)
            overview.applyWeeklyGoal(goal)
          }}
          onClose={closeDialog}
        />
      )}

      {openDialog === 'event' && (
        <EventFormDialog defaultDate={defaultEventDate} onSaved={handleEventCreated} onClose={closeDialog} />
      )}

      {detailDate && dayEvents.length > 0 && (
        <EventDetailDialog
          date={detailDate}
          events={dayEvents}
          onEdit={(event) => setOpenDialog({ kind: 'edit', event })}
          onDeleted={handleEventDeleted}
          onClose={closeDialog}
        />
      )}

      {typeof openDialog === 'object' && openDialog?.kind === 'edit' && (
        <EventFormDialog
          event={openDialog.event}
          defaultDate={openDialog.event.date}
          onSaved={(event) => handleEventUpdated(openDialog.event, event)}
          onGone={handleEventGone}
          onClose={closeDialog}
        />
      )}
    </>
  )
}
