import { api } from '@/shared/api/apiClient'

import type { HomeOverview, PracticePeriod, PracticeRecord } from '../types/home'

import type { HomeOverviewResponse, PracticeRecordResponse } from './homeResponse'

import './homeMock'

/**
 * 홈 대시보드에서 기간과 상관없는 것 전부. `GET /api/home`
 *
 * **백엔드에 없는 API 입니다.** 경로도 프론트가 임시로 정했습니다. 목업(`missingInBackend`)이 답합니다.
 * `VITE_REAL_APIS` 이름은 `home` 입니다.
 */
export async function getHomeOverview(): Promise<HomeOverview> {
  const response = await api.get<HomeOverviewResponse>('/api/home')

  return {
    thisMonth: response.thisMonth,
    streak: { current: response.streak.currentDays, best: response.streak.bestDays },
    recentReports: response.recentReports.map((report) => ({
      reportId: report.reportId,
      title: report.title,
      kind: report.interviewKind,
      practicedOn: report.practicedOn,
      questionCount: report.questionCount,
      durationSec: report.durationSec,
      score: report.totalScore,
    })),
    badges: {
      earnedCount: response.badges.earnedCount,
      totalCount: response.badges.totalCount,
      featured: response.badges.featured.map((badge) => ({
        code: badge.badgeCode,
        name: badge.badgeName,
        description: badge.description,
        tone: badge.tone,
        earned: badge.earnedAt !== null,
      })),
      nextHint: response.badges.nextHint,
    },
    weeklyGoal: response.weeklyGoal && {
      title: response.weeklyGoal.title,
      target: response.weeklyGoal.targetValue,
      done: response.weeklyGoal.currentValue,
    },
    upcomingEvents: response.upcomingEvents,
    talentKeywords: response.talentKeywords,
    popularQuestions: response.popularQuestions,
  }
}

/**
 * 연습 기록 카드(잔디 · 점수 추이)와 위쪽 "기간 평균 · 총 연습" 카드. `GET /api/home/practice?period=10w`
 *
 * 기간 탭을 바꿀 때마다 이것만 다시 부릅니다. 배지 · 일정까지 같이 다시 받을 이유가 없어서 둘로 나눴습니다.
 * **백엔드에 없는 API 입니다.**
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
