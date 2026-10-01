import Badge from '@/shared/ui/Badge'
import Card from '@/shared/ui/Card'

import { formatDotDateWithWeekday } from '../lib/homeDate'
import { dDayOf } from '../lib/homeDisplay'
import type { UpcomingEvent } from '../types/home'

import CardHeader from './CardHeader'
import SkeletonBlock from './SkeletonBlock'

type Props = {
  /** null 이면 불러오는 중 */
  events: UpcomingEvent[] | null
}

/**
 * 다가오는 면접일. 일주일 안에 있는 일정은 왼쪽 줄과 D-day 를 강조합니다.
 * 일정을 넣는 곳은 성장 관리(C-04)의 일정 등록 모달인데 그 화면이 아직 없습니다.
 */
export default function UpcomingEventsCard({ events }: Props) {
  return (
    <Card label="다가오는 면접일" padding="lg">
      <CardHeader title="다가오는 면접일" />

      {events === null ? (
        <div aria-busy className="mt-4 flex flex-col gap-4">
          {[0, 1].map((index) => (
            <span key={index} className="flex flex-col gap-2">
              <SkeletonBlock className="h-5 w-32" />
              <SkeletonBlock className="h-4 w-40" />
            </span>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="mt-4 text-body-md text-neutral-500">등록된 면접 일정이 없어요.</p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200">
          {events.map((event) => {
            const dDay = dDayOf(event.date)
            return (
              <li key={event.eventId} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <span
                  aria-hidden
                  className={`w-0.5 self-stretch rounded-full ${dDay.urgent ? 'bg-primary-500' : 'bg-neutral-300'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-lg text-neutral-900">{event.title}</p>
                  <p className="text-body-sm text-neutral-500">
                    <time dateTime={event.time ? `${event.date}T${event.time}` : event.date}>
                      {formatDotDateWithWeekday(event.date)}
                      {event.time && ` ${event.time}`}
                    </time>
                  </p>
                </div>
                <Badge tone={dDay.urgent ? 'danger' : 'neutral'}>{dDay.label}</Badge>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
