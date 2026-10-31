import type {
  BadgeTone,
  CalendarEvent,
  CalendarMonth,
  GrowthOverview,
  WeeklyGoal,
} from '../types/growth'

/**
 * 성장 관리 서버 응답 모양입니다. **백엔드에 아직 없는 API 라 프론트가 정한 임시안입니다.**
 *
 * 필드는 백엔드 엔티티(`Goal` · `Badge` · `CalendarEvent`)의 이름을 따랐습니다. 백엔드가 만들 때 그대로 쓰거나,
 * 바뀌면 이 파일과 변환 함수만 고치면 됩니다.
 *
 * **테이블에 그대로 있지 않은 값**은 백엔드가 계산해서 내려줘야 합니다. 요청할 때 따로 적습니다.
 * - `latestReport` — 가장 최근 세션의 리포트 중 **완료 · 부분(COMPLETED · PARTIAL)** 인 것. 분석 중 · 실패 리포트는 건너뜁니다
 *   — 그래야 이 id 로 부르는 회차 비교가 202 `REPORT_NOT_READY` · 409 `REPORT_FAILED` 로 막히지 않습니다
 * - `weeklyGoal.doneCount` — 이번 주(월 ~ 일) 연습 횟수
 * - `practicedDates` — 그 달의 `streak.activity_date`
 *
 * 점수 추이 · 이전 회차 대비 변화는 리포트 도메인의 회차 비교 API 가 줍니다 (`report/api/reportComparisonApi.ts`).
 */

/** `GET /api/growth` */
export type GrowthOverviewResponse = {
  latestReport: { reportId: string; companyName: string | null; jobRole: string } | null
  weeklyGoal: WeeklyGoalResponse | null
  badges: Array<{ badgeCode: string; badgeName: string; tone: BadgeTone; earnedAt: string | null }>
}

/** `GET /api/growth` 의 `weeklyGoal`, `PATCH /api/growth/weekly-goal` 의 응답 */
export type WeeklyGoalResponse = {
  /** `goal.target_value` (`goal_type` WEEKLY · `target_metric` SESSION_COUNT) */
  targetValue: number
  doneCount: number
}

export type CalendarEventResponse = {
  calendarEventId: string
  title: string
  /** 보는 사람의 시간대가 붙은 시각. 시간을 안 적었으면 그날 00:00 이고 `timeSpecified` 가 false 입니다 */
  scheduledAt: string
  timeSpecified: boolean
  memo: string | null
}

/** `GET /api/calendar?month=YYYY-MM` */
export type CalendarMonthResponse = {
  month: string
  events: CalendarEventResponse[]
  practicedDates: string[]
}

/**
 * `POST /api/calendar/events` 본문. 응답은 `CalendarEventResponse` 입니다.
 *
 * 백엔드 `calendar_event.scheduled_at` 이 시각 하나라서 날짜 · 시간을 합쳐 보냅니다. 시간을 안 적으면 그날 00:00 으로
 * 보내고 `timeSpecified: false` 로 구분합니다 — "자정 면접" 과 "시간 미정" 이 같은 값이 되지 않게 하려는 칸이라,
 * 백엔드에 요청할 때 `title` 과 함께 추가를 적습니다 (엔티티에는 둘 다 없습니다).
 */
export type CalendarEventCreateRequest = {
  title: string
  scheduledAt: string
  timeSpecified: boolean
  memo: string | null
}

/** 면접 묶음 이름. 기업을 고르지 않은 면접은 직무만 씁니다 */
function interviewTitle(companyName: string | null, jobRole: string) {
  return [companyName, `${jobRole} 면접`].filter(Boolean).join(' · ')
}

export function toWeeklyGoal(response: WeeklyGoalResponse): WeeklyGoal {
  return { target: response.targetValue, done: response.doneCount }
}

export function toGrowthOverview(response: GrowthOverviewResponse): GrowthOverview {
  const latest = response.latestReport
  return {
    latestInterview: latest
      ? { reportId: latest.reportId, title: interviewTitle(latest.companyName, latest.jobRole) }
      : null,
    weeklyGoal: response.weeklyGoal ? toWeeklyGoal(response.weeklyGoal) : null,
    badges: response.badges.map((badge) => ({
      code: badge.badgeCode,
      name: badge.badgeName,
      tone: badge.tone,
      earned: badge.earnedAt !== null,
    })),
  }
}

/** `2026-08-14T14:00:00+09:00` 을 보는 사람의 날짜 · 시각으로 나눕니다 */
function splitScheduledAt(scheduledAt: string) {
  const date = new Date(scheduledAt)
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

export function toCalendarEvent(response: CalendarEventResponse): CalendarEvent {
  const { date, time } = splitScheduledAt(response.scheduledAt)
  return {
    eventId: response.calendarEventId,
    title: response.title,
    date,
    time: response.timeSpecified ? time : null,
    memo: response.memo,
  }
}

export function toCalendarMonth(response: CalendarMonthResponse): CalendarMonth {
  return {
    month: response.month,
    events: response.events.map(toCalendarEvent),
    practicedDates: response.practicedDates,
  }
}
