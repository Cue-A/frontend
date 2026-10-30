import { useState } from 'react'

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
 * 위쪽 네 카드는 한 번에 받고(`useGrowthOverview`), 캘린더는 달을 넘길 때마다 따로 받습니다(`useCalendarMonth`) —
 * 달을 넘길 때마다 점수 추이까지 다시 받을 이유가 없습니다.
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
  const [notice, setNotice] = useState<string | null>(null)

  const ready = overview.status === 'ready' ? overview.overview : undefined

  const openGoal = () => {
    setNotice(null)
    setOpenDialog('goal')
  }
  const openEvent = () => {
    setNotice(null)
    setOpenDialog('event')
  }

  // 등록한 일정이 다른 달이면 그 달로 넘겨서 바로 보이게 합니다. 같은 달이면 뒤에서 다시 받습니다.
  const handleEventCreated = (event: CalendarEvent) => {
    setNotice(`‘${event.title}’ 일정을 ${shortDate(event.date)}에 등록했어요.`)
    if (monthOf(event.date) === month) calendar.refresh()
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

        {notice && (
          <p role="status" className="text-body-sm text-badge-success-text">
            {notice}
          </p>
        )}

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
              <ScoreRoundsCard scoreRounds={ready?.scoreRounds} />
              <WeeklyGoalCard goal={ready?.weeklyGoal} onEdit={openGoal} />
              <BadgesCard badges={ready?.badges} />
            </div>
            <RoundChangeCard roundChange={ready?.roundChange} />
          </>
        )}

        <InterviewCalendarCard
          month={month}
          today={today}
          calendar={calendar}
          onMonthChange={setMonth}
          onAddEvent={openEvent}
        />
      </div>

      {openDialog === 'goal' && ready && (
        <GoalEditDialog
          goal={ready.weeklyGoal}
          onSaved={(goal) => {
            setNotice(`이번 주 목표를 ${goal.target}회로 정했어요.`)
            overview.refresh()
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
