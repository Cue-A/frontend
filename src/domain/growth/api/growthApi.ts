import { api } from '@/shared/api/apiClient'

import type { CalendarEventDraft } from '../types/growth'

import {
  toCalendarEvent,
  toCalendarMonth,
  toGrowthOverview,
  toLatestInterview,
  toWeeklyGoal,
  type CalendarEventCreateRequest,
  type CalendarEventResponse,
  type CalendarMonthResponse,
  type GrowthOverviewResponse,
  type LatestReportListResponse,
  type WeeklyGoalResponse,
} from './growthResponse'

import './growthMock'

/*
 * 성장 관리 API 입니다. 모두 백엔드에 있습니다 (이슈 #201).
 * - 가장 최근 리포트 `/api/home/recent-reports`
 * - 이번 주 목표 · 배지 `/api/growth` · `/api/growth/weekly-goal` (Cue-A/backend#132 · #134) — `VITE_REAL_APIS` 이름 `growth`
 * - 면접 캘린더 `/api/calendar` (Cue-A/backend#133) — `VITE_REAL_APIS` 이름 `calendar`
 */

/**
 * 이번 주 목표 · 배지. `GET /api/growth` (Cue-A/backend#132 · #134). 목표를 안 정했으면 `weeklyGoal` 이 null 입니다.
 * 배지는 받지 않은 것까지 다섯 개가 다 오고(`earnedAt: null`), 서버가 조회할 때 빠진 배지를 그 자리에서 지급합니다.
 */
export async function getGrowthOverview() {
  const response = await api.get<GrowthOverviewResponse>('/api/growth')
  return toGrowthOverview(response)
}

/**
 * 가장 최근 리포트. `GET /api/home/recent-reports?limit=1` (백엔드에 있습니다)
 *
 * 점수 추이 · 이전 회차 대비 변화는 이 리포트로 회차 비교(`GET /api/reports/{reportId}/comparison`)를 따로 부릅니다.
 * 리포트 id 를 실서버에서 받아야 실서버 회차 비교가 그 리포트를 찾습니다.
 *
 * 목표 · 배지와 따로 부릅니다. 도메인(`home` · `growth`)이 달라 한쪽만 실서버이거나 한쪽만 실패할 수 있는데, 같이 받으면
 * 최근 리포트만 실패해도 목표 · 배지 칸까지 오류가 됩니다 (PR #184 리뷰).
 */
export async function getLatestInterview() {
  const response = await api.get<LatestReportListResponse>('/api/home/recent-reports?limit=1')
  return toLatestInterview(response)
}

/**
 * 이번 주 목표 횟수를 바꿉니다. 목표가 없으면 새로 만듭니다. `PATCH /api/growth/weekly-goal` (본문 `{ targetValue }`)
 *
 * 1 ~ 7 회가 아니면 `INVALID_REQUEST` 로 봅니다.
 */
export async function updateWeeklyGoal(targetValue: number) {
  const response = await api.patch<WeeklyGoalResponse>('/api/growth/weekly-goal', { targetValue })
  return toWeeklyGoal(response)
}

/**
 * 그 달의 면접 일정과 연습한 날. `GET /api/calendar?month=YYYY-MM` (Cue-A/backend#133)
 *
 * 연습한 날(`practicedDates`)은 서버가 완료한 면접에서 한국 시간 날짜로 셉니다. 일정은 날짜 · 시간 순입니다.
 */
export async function getCalendarMonth(month: string) {
  const response = await api.get<CalendarMonthResponse>(`/api/calendar?month=${month}`)
  return toCalendarMonth(response)
}

/** 날짜 · 시간(보는 사람 기준)을 시각 하나로 합칩니다. 시간이 없으면 그날 00:00 입니다 */
function toScheduledAt(date: string, time: string | null) {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = (time ?? '00:00').split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes).toISOString()
}

function toEventRequest(draft: CalendarEventDraft): CalendarEventCreateRequest {
  return {
    title: draft.title,
    scheduledAt: toScheduledAt(draft.date, draft.time),
    timeSpecified: draft.time !== null,
    memo: draft.memo,
  }
}

/**
 * 면접 일정을 등록합니다. `POST /api/calendar/events`
 *
 * 제목은 앞뒤 공백을 자른 뒤 1 ~ 50자, 메모는 300자까지입니다. 넘으면 `INVALID_REQUEST` 로 봅니다.
 */
export async function createCalendarEvent(draft: CalendarEventDraft) {
  const response = await api.post<CalendarEventResponse>('/api/calendar/events', toEventRequest(draft))
  return toCalendarEvent(response)
}

/**
 * 면접 일정을 고칩니다. `PUT /api/calendar/events/{calendarEventId}` (이슈 #190, Cue-A/backend#133)
 *
 * 등록과 같은 네 칸을 다 보내 통째로 바꾸고(PUT), 고친 일정을 돌려받습니다. 규칙도 등록과 같습니다. 없는 일정(다른 탭에서
 * 지움)은 `CALENDAR_EVENT_NOT_FOUND`(404) 입니다.
 */
export async function updateCalendarEvent(eventId: string, draft: CalendarEventDraft) {
  const response = await api.put<CalendarEventResponse>(
    `/api/calendar/events/${encodeURIComponent(eventId)}`,
    toEventRequest(draft),
  )
  return toCalendarEvent(response)
}

/**
 * 면접 일정을 지웁니다. `DELETE /api/calendar/events/{calendarEventId}` (이슈 #190, Cue-A/backend#133)
 *
 * 되돌릴 수 없어서 화면이 한 번 묻고 부릅니다. 이미 지운 일정을 다시 지우면 `CALENDAR_EVENT_NOT_FOUND`(404) 입니다
 * (서버가 멱등하게 두지 않았습니다).
 */
export async function deleteCalendarEvent(eventId: string) {
  await api.delete<void>(`/api/calendar/events/${encodeURIComponent(eventId)}`)
}
