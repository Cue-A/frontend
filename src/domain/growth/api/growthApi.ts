import { api } from '@/shared/api/apiClient'

import type { CalendarEventDraft } from '../types/growth'

import {
  toCalendarEvent,
  toCalendarMonth,
  toGrowthOverview,
  toWeeklyGoal,
  type CalendarEventCreateRequest,
  type CalendarEventResponse,
  type CalendarMonthResponse,
  type GrowthOverviewResponse,
  type WeeklyGoalResponse,
} from './growthResponse'

import './growthMock'

/*
 * 성장 관리 API 입니다. **모두 백엔드에 없는 API 입니다.** 경로 · 본문 · 응답 모양 모두 프론트 임시안이고
 * 목업(`missingInBackend`)이 답합니다. 엔티티는 있습니다 — growth(Goal · Badge · UserBadge · Streak) · calendar(CalendarEvent).
 */

/**
 * 이번 주 목표 · 배지 · 가장 최근 리포트. `GET /api/growth`
 *
 * 점수 추이 · 이전 회차 대비 변화는 가장 최근 리포트로 회차 비교(`GET /api/reports/{reportId}/comparison`)를 따로 부릅니다.
 */
export async function getGrowthOverview() {
  const response = await api.get<GrowthOverviewResponse>('/api/growth')
  return toGrowthOverview(response)
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

/** 그 달의 면접 일정과 연습한 날. `GET /api/calendar?month=YYYY-MM` */
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

/**
 * 면접 일정을 등록합니다. `POST /api/calendar/events`
 *
 * 제목은 앞뒤 공백을 자른 뒤 1 ~ 50자, 메모는 300자까지입니다. 넘으면 `INVALID_REQUEST` 로 봅니다.
 */
export async function createCalendarEvent(draft: CalendarEventDraft) {
  const body: CalendarEventCreateRequest = {
    title: draft.title,
    scheduledAt: toScheduledAt(draft.date, draft.time),
    timeSpecified: draft.time !== null,
    memo: draft.memo,
  }
  const response = await api.post<CalendarEventResponse>('/api/calendar/events', body)
  return toCalendarEvent(response)
}
