import { useState } from 'react'

import { useReportComparison } from '@/domain/report/hooks/useReportComparison'
import { toUserMessage } from '@/shared/api/errorMessage'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useCalendarMonth } from '../hooks/useCalendarMonth'
import { useGrowthOverview } from '../hooks/useGrowthOverview'
import { monthOf, shortDate, toDateKey, toMonthKey } from '../lib/calendarDate'
import type { CalendarEvent } from '../types/growth'

import BadgesCard from './BadgesCard'
import EventCreateDialog from './EventCreateDialog'
import GoalEditDialog from './GoalEditDialog'
import GrowthTopBar from './GrowthTopBar'
import InterviewCalendarCard from './InterviewCalendarCard'
import RoundChangeCard from './RoundChangeCard'
import ScoreRoundsCard from './ScoreRoundsCard'
import WeeklyGoalCard from './WeeklyGoalCard'

type OpenDialog = 'goal' | 'event' | null

/**
 * 성장 관리 (C-04).
 *
 * 회차를 거치며 무엇이 달라졌는지(점수 추이 · 이전 회차 대비 변화)와 이번 주 목표 · 배지를 보고, 면접 일정을 관리합니다.
 *
 * 세 가지를 따로 받습니다.
 * - `useGrowthOverview` — 이번 주 목표 · 배지 · 가장 최근 리포트
 * - `useReportComparison` — 그 리포트의 회차 비교(점수 추이 · 이전 회차 대비 변화). AI 가 계산해서 몇 초 걸리고 60초에
 *   10회 제한이 있어서, 목표를 고쳐 요약을 새로 받아도 리포트가 같으면 다시 부르지 않습니다
 * - `useCalendarMonth` — 캘린더 한 달치. 달을 넘길 때마다 받습니다
 *
 * 본문 폭은 시안대로 1040px 입니다 (왼쪽 688 · 오른쪽 336 · 사이 16).
 *
 * **백엔드에 성장 관리 API 가 없어서 목업으로만 동작합니다** (api/growthApi.ts). 일정 수정 · 삭제와 날짜를 눌러 일정 보기는
 * 이번 범위 밖입니다 (이슈 #136).
 */
export default function GrowthPage() {
  const overview = useGrowthOverview()
  // 자정을 넘겨도 화면을 새로 열기 전까지는 같은 "오늘" 로 둡니다. 그리는 도중 오늘이 바뀌면 칸이 어긋납니다.
  const [today] = useState(() => toDateKey(new Date()))
  const [month, setMonth] = useState(() => toMonthKey(new Date()))
  const calendar = useCalendarMonth(month)
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)
  // 저장 · 등록 알림은 그 일을 한 카드 안에 띄웁니다. 맨 위에 두면 눈에 띄지 않습니다. (PR #137 리뷰)
  const [goalNotice, setGoalNotice] = useState<string | null>(null)
  const [eventNotice, setEventNotice] = useState<string | null>(null)

  const ready = overview.status === 'ready' ? overview.overview : undefined
  const interview = ready?.latestInterview
  const comparison = useReportComparison(interview?.reportId ?? null)

  // 창을 열면 앞서 남은 알림은 지웁니다
  const openGoal = () => {
    setGoalNotice(null)
    setEventNotice(null)
    setOpenDialog('goal')
  }
  const openEvent = () => {
    setGoalNotice(null)
    setEventNotice(null)
    setOpenDialog('event')
  }

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
              <ScoreRoundsCard interview={interview} comparison={comparison} />
              <WeeklyGoalCard goal={ready?.weeklyGoal} notice={goalNotice} onEdit={openGoal} />
              <BadgesCard badges={ready?.badges} />
            </div>
            <RoundChangeCard interview={interview} comparison={comparison} />
          </>
        )}

        <InterviewCalendarCard
          month={month}
          today={today}
          calendar={calendar}
          notice={eventNotice}
          onMonthChange={changeMonth}
          onAddEvent={openEvent}
        />
      </div>

      {openDialog === 'goal' && ready && (
        <GoalEditDialog
          goal={ready.weeklyGoal}
          onSaved={(goal) => {
            setGoalNotice(`이번 주 목표를 ${goal.target}회로 정했어요.`)
            overview.applyWeeklyGoal(goal)
          }}
          onClose={() => setOpenDialog(null)}
        />
      )}

      {openDialog === 'event' && (
        <EventCreateDialog
          defaultDate={defaultEventDate}
          onCreated={handleEventCreated}
          onClose={() => setOpenDialog(null)}
        />
      )}
    </>
  )
}
