import { api } from '@/shared/api/apiClient'

import { toIsoDate } from '../lib/homeDate'
import { BADGE_DESCRIPTION, isBadgeCode } from '../lib/homeDisplay'
import type {
  HomeExtras,
  HomeGrowth,
  HomeStats,
  PracticePeriod,
  PracticeRecord,
  RecentReport,
  UpcomingEvent,
} from '../types/home'

import type {
  HomeExtrasResponse,
  HomeGrowthResponse,
  HomeStatsResponse,
  PracticeRecordResponse,
  RecentReportListResponse,
  RecentReportResponse,
  UpcomingEventListResponse,
} from './homeResponse'

import './homeMock'

/** 홈의 "최근 리포트 요약" 줄 수 (시안의 세 줄) */
export const RECENT_REPORT_COUNT = 3

/**
 * 이번 달 연습 일수 · 연속 학습. `GET /api/home/stats` (Cue-A/backend#116)
 *
 * 같은 날 여러 번 해도 하루로 셉니다. 완료한 면접만 세고 재연습도 들어갑니다. 지난달 같은 기간 기록이 없으면
 * `diffFromLastMonth` 가 null 입니다. `VITE_REAL_APIS` 이름은 `home` 입니다.
 */
export async function getHomeStats(): Promise<HomeStats> {
  const response = await api.get<HomeStatsResponse>('/api/home/stats')
  return {
    thisMonth: response.thisMonth,
    streak: { current: response.streak.currentDays, best: response.streak.bestDays },
  }
}

/** 리포트 제목. 기업 · 직무이고, 기업을 고르지 않은 면접이면 직무만입니다 */
function reportTitle(report: RecentReportResponse) {
  return [report.companyName, report.jobRole].filter(Boolean).join(' · ')
}

/**
 * 최근 리포트 요약. `GET /api/home/recent-reports?limit=` (1 ~ 10, Cue-A/backend#108)
 *
 * 볼 수 있는 리포트(완료 · 부분)만 최근 연습순으로 옵니다. 분석 중 · 실패한 리포트는 빠집니다.
 */
export async function getRecentReports(limit = RECENT_REPORT_COUNT): Promise<RecentReport[]> {
  const response = await api.get<RecentReportListResponse>(`/api/home/recent-reports?limit=${limit}`)
  return response.reports.map((report) => ({
    reportId: report.reportId,
    title: reportTitle(report),
    // 서버는 시각(시간대 포함)을 줍니다. 화면은 보는 사람 기준 날짜로 씁니다
    practicedOn: toIsoDate(new Date(report.practicedOn)),
    questionCount: report.questionCount,
    score: report.scoreTotal,
    partial: report.status === 'PARTIAL',
  }))
}

/**
 * 기업별 인재상 · 질문은행. `GET /api/home`
 *
 * **백엔드에 없는 API 입니다.** 경로도 프론트가 임시로 정했고 목업(`missingInBackend`)이 답합니다. 배지 · 다가오는 일정은
 * 실서버로 옮겼습니다 (`getHomeGrowth` · `getUpcomingEvents`, 이슈 #201).
 */
export async function getHomeExtras(): Promise<HomeExtras> {
  const response = await api.get<HomeExtrasResponse>('/api/home')
  return { talentKeywords: response.talentKeywords, popularQuestions: response.popularQuestions }
}

/** 홈 "다가오는 면접일" 줄 수 (시안의 세 줄까지). 서버는 1 ~ 10 을 받습니다 */
export const UPCOMING_EVENT_COUNT = 3

/**
 * 다가오는 면접 일정. `GET /api/calendar/events/upcoming?limit=` (Cue-A/backend#133) — `VITE_REAL_APIS` 이름은 `calendar` 입니다.
 *
 * 지금 이후의 일정만 가까운 순으로 옵니다. 날짜만 적은 일정은 그날 00:00 이라, 오늘 날짜만 있는 일정은 서버가 이미 지난 것으로
 * 뺍니다. 날짜(`YYYY-MM-DD`) · 시각(`HH:mm`, 시간을 안 적었으면 null)은 서버가 한국 시간으로 쪼개서 줍니다. 일정은 성장 관리의
 * 면접 캘린더에서 넣습니다.
 */
export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const response = await api.get<UpcomingEventListResponse>(`/api/calendar/events/upcoming?limit=${UPCOMING_EVENT_COUNT}`)
  return response.events.map((event) => ({
    eventId: event.eventId,
    title: event.title,
    date: event.date,
    time: event.time,
  }))
}

/**
 * 연습 기록 카드(잔디 · 점수 추이)와 위쪽 "기간 평균 · 총 연습" 카드. `GET /api/home/practice?period=10w`
 * (Cue-A/backend#116)
 *
 * 기간 탭을 바꿀 때마다 이것만 다시 부릅니다. 기간은 오늘을 넣어 거꾸로 센 날 수입니다(4w 28일 · 10w 70일 · 6m 182일 ·
 * 1y 364일). 평균 · 최고 점수는 점수가 있는 리포트만 세고, 없으면 null 입니다.
 */
export async function getPracticeRecord(period: PracticePeriod): Promise<PracticeRecord> {
  const response = await api.get<PracticeRecordResponse>(`/api/home/practice?period=${period}`)

  return {
    period: response.period,
    startDate: response.startDate,
    endDate: response.endDate,
    days: response.days,
    totalCount: response.totalCount,
    activeDays: response.activeDays,
    averageScore: response.averageScore,
    bestScore: response.bestScore,
    trend: response.trend,
  }
}

/**
 * 이번 주 목표 · 배지. `GET /api/growth` (Cue-A/backend#132 · #134) — `VITE_REAL_APIS` 이름은 `growth` 입니다.
 *
 * 성장 관리와 같은 곳에서 받아 두 화면의 숫자가 늘 같습니다 (이슈 #201 — 홈도 /api/growth 로 받기로 정함). 전에는 배지를
 * `GET /api/home`(목업)에서 받았는데, 서버에 배지가 들어와서(#134) 목표와 같은 요청으로 받습니다. 목표를 고치는 창은 성장 관리에 있습니다.
 *
 * - 서버 목표에는 제목이 없어서, 목표 횟수로 한 줄을 만듭니다
 * - 배지는 설명 글이 오지 않아 배지 코드로 화면이 정합니다(`BADGE_DESCRIPTION`). 서버 시드의 설명과 같은 글입니다.
 *   모르는 배지 코드는 아이콘을 고를 수 없어서 뺍니다
 * - 목업 모드에서는 성장 관리 목업(`growth/api/growthMock.ts`)이 답합니다 — 라우터가 모든 화면을 처음에 불러와서 홈에서도 그
 *   목업이 등록돼 있습니다
 */
export async function getHomeGrowth(): Promise<HomeGrowth> {
  const response = await api.get<HomeGrowthResponse>('/api/growth')
  const goal = response.weeklyGoal

  return {
    weeklyGoal: goal
      ? { title: `이번 주 연습 ${goal.targetValue}번 하기`, target: goal.targetValue, done: goal.doneCount }
      : null,
    badges: response.badges.flatMap((badge) =>
      isBadgeCode(badge.badgeCode)
        ? [
            {
              code: badge.badgeCode,
              name: badge.badgeName,
              description: BADGE_DESCRIPTION[badge.badgeCode],
              tone: badge.tone,
              earned: badge.earnedAt !== null,
            },
          ]
        : [],
    ),
  }
}
