import { api } from '@/shared/api/apiClient'

import { toIsoDate } from '../lib/homeDate'
import type { HomeExtras, HomeStats, PracticePeriod, PracticeRecord, RecentReport } from '../types/home'

import type {
  HomeExtrasResponse,
  HomeStatsResponse,
  PracticeRecordResponse,
  RecentReportListResponse,
  RecentReportResponse,
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
 * 배지 · 이번 주 목표 · 다가오는 일정 · 인재상 · 질문은행. `GET /api/home`
 *
 * **백엔드에 없는 API 입니다.** 경로도 프론트가 임시로 정했고 목업(`missingInBackend`)이 답합니다. 배지 지급 기준 ·
 * 목표 설정 · 일정 관리는 백엔드 기획이 정해진 뒤 따로 붙입니다.
 */
export async function getHomeExtras(): Promise<HomeExtras> {
  const response = await api.get<HomeExtrasResponse>('/api/home')

  return {
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
