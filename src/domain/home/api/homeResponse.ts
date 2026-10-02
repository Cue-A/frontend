/**
 * 홈 API 응답 모양입니다. **백엔드에 아직 없는 API 라 프론트가 임시로 정한 계약입니다.**
 *
 * 화면 타입(`types/home.ts`)과 일부러 따로 둡니다. 지금은 거의 같지만, 백엔드와 계약을 맞추면서 필드 이름이
 * 바뀌어도 고칠 곳이 이 파일과 `homeApi.ts` 의 옮겨 담는 부분뿐이게 하려는 것입니다.
 *
 * 백엔드에 생기면 쪼개질 수 있습니다 — 배지 · 연속 기록 · 목표는 growth, 일정은 calendar_event,
 * 인재상은 company, 질문은행은 question 쪽 테이블이라 한 API 로 안 올 가능성이 큽니다.
 */
import type { BadgeCode, BadgeTone, InterviewKind, PracticePeriod } from '../types/home'

export type HomeOverviewResponse = {
  thisMonth: { month: number; activeDays: number; diffFromLastMonth: number | null }
  streak: { currentDays: number; bestDays: number }
  recentReports: Array<{
    reportId: string
    title: string
    interviewKind: InterviewKind
    practicedOn: string
    questionCount: number
    durationSec: number
    totalScore: number
  }>
  badges: {
    earnedCount: number
    totalCount: number
    featured: Array<{
      badgeCode: BadgeCode
      badgeName: string
      description: string
      tone: BadgeTone
      earnedAt: string | null
    }>
    nextHint: string | null
  }
  weeklyGoal: { title: string; targetValue: number; currentValue: number } | null
  upcomingEvents: Array<{ eventId: string; title: string; date: string; time: string | null }>
  talentKeywords: string[]
  popularQuestions: string[]
}

export type PracticeRecordResponse = {
  period: PracticePeriod
  startDate: string
  endDate: string
  days: Array<{ date: string; count: number }>
  totalCount: number
  activeDays: number
  averageScore: number | null
  bestScore: number | null
  trend: { unit: 'session' | 'month'; points: Array<{ label: string; score: number }> }
}
