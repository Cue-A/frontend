/**
 * 홈 API 응답 모양입니다.
 *
 * 화면 타입(`types/home.ts`)과 일부러 따로 둡니다. 서버 필드 이름이 바뀌어도 고칠 곳이 이 파일과 `homeApi.ts` 의
 * 옮겨 담는 부분뿐이게 하려는 것입니다.
 *
 * - `/api/home/stats` · `/api/home/recent-reports` · `/api/home/practice` — 백엔드에 있습니다(Cue-A/backend#108 · #116).
 *   모양은 그 응답 DTO(`HomeStatsResponse` · `RecentReportListResponse` · `HomePracticeResponse`)와 같습니다
 * - `/api/home` — **백엔드에 없는 프론트 임시안**입니다. 배지 · 이번 주 목표 · 다가오는 일정 · 인재상 · 질문은행을 담고
 *   목업이 답합니다. 백엔드가 기획 · 범위를 정하면 그 API 로 바꿉니다
 */
import type { BadgeTone, PracticePeriod } from '../types/home'

/** `GET /api/home/stats` */
export type HomeStatsResponse = {
  thisMonth: {
    month: number
    activeDays: number
    /** 지난달 같은 기간 대비 증감. 비교할 지난달 기록이 없으면 null (0 이 아닙니다) */
    diffFromLastMonth: number | null
  }
  streak: { currentDays: number; bestDays: number }
}

/** `GET /api/home/recent-reports` 한 줄 */
export type RecentReportResponse = {
  reportId: string
  /** 회사를 고르지 않았으면 null */
  companyName: string | null
  jobRole: string
  /** 고른 문항 수. 되묻기는 세지 않습니다 */
  questionCount: number
  status: 'COMPLETED' | 'PARTIAL'
  /** 종합 점수 0 ~ 100. 점수가 없으면 null */
  scoreTotal: number | null
  /** 면접 본 시각(ISO 8601, 시간대 포함). 정렬 기준이고 다시 분석해도 바뀌지 않습니다 */
  practicedOn: string
}

/** `GET /api/home/recent-reports` */
export type RecentReportListResponse = {
  /** 최근 리포트순. 없으면 빈 배열 */
  reports: RecentReportResponse[]
}

/** `GET /api/home` — 백엔드에 없는 프론트 임시안. 인재상 · 질문은행만 남았습니다 (배지 · 일정은 이슈 #201 에서 실서버로) */
export type HomeExtrasResponse = {
  talentKeywords: string[]
  popularQuestions: string[]
}

/** `GET /api/calendar/events/upcoming?limit=` (Cue-A/backend#133) */
export type UpcomingEventListResponse = {
  /** 지금 이후 일정, 가까운 순. 날짜 · 시각은 한국 시간으로 쪼개져 옵니다 */
  events: Array<{ eventId: string; title: string; date: string; time: string | null }>
}

/** `GET /api/home/practice?period=` */
export type PracticeRecordResponse = {
  period: PracticePeriod
  startDate: string
  endDate: string
  days: Array<{ date: string; count: number }>
  totalCount: number
  activeDays: number
  /** 볼 수 있고 점수가 있는 리포트만 셉니다. 없으면 null (0 이 아닙니다) */
  averageScore: number | null
  bestScore: number | null
  /** 4w · 10w 는 회차별(최근 8개), 6m · 1y 는 월 평균. 점수 없는 날 · 달은 점으로 넣지 않습니다 */
  trend: { unit: 'session' | 'month'; points: Array<{ date: string; label: string; score: number }> }
}

/**
 * `GET /api/growth` 에서 홈이 쓰는 칸 — 이번 주 목표 · 배지 (Cue-A/backend#132 · #134). 성장 관리 도메인의 api 를 가져다
 * 쓰지 않는 규칙이라(docs/01-conventions.md) 여기 따로 적습니다. 전체 모양은 `growth/api/growthResponse.ts` 의
 * `GrowthOverviewResponse` 입니다.
 *
 * 배지는 받지 않은 것까지 다섯 개가 다 오고, 받지 않았으면 `earnedAt` 이 null 입니다. 설명 글은 오지 않아 화면이 정합니다.
 */
export type HomeGrowthResponse = {
  /** 이번 주 목표를 안 정했으면 null */
  weeklyGoal: { targetValue: number; doneCount: number } | null
  badges: Array<{ badgeCode: string; badgeName: string; tone: BadgeTone; earnedAt: string | null }>
}
