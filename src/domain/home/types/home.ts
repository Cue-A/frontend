/**
 * 홈 대시보드(A-04)에서 쓰는 화면 타입입니다.
 *
 * ⚠️ **백엔드에 홈용 API 가 없습니다.** growth 도메인에 엔티티(Badge · UserBadge · Streak · Goal)만 있고
 * 컨트롤러가 없어서(Cue-A/backend dev, 2026-10-01 확인) 이 타입은 시안을 보고 프론트가 먼저 정한 모양입니다.
 * 서버 응답 모양은 `api/homeResponse.ts` 에 따로 두고 `api/homeApi.ts` 에서 옮겨 담습니다 —
 * 계약이 정해져서 서버 필드가 바뀌어도 화면이 같이 흔들리지 않게 하려는 것입니다 (docs/01-conventions.md "타입").
 */

/** 연습 기록 카드의 기간 탭. 4주 · 10주 · 6개월 · 1년 (시안 mode-chips `1247:1709`) */
export type PracticePeriod = '4w' | '10w' | '6m' | '1y'

/* ---------------------------------------------------------------------------
 * 기간과 상관없는 묶음 — `GET /api/home`
 * ------------------------------------------------------------------------- */

export type MonthlyActivity = {
  /** 1 ~ 12 */
  month: number
  /** 이번 달에 연습한 날 수 */
  activeDays: number
  /**
   * **지난달 같은 기간**(1일 ~ 오늘과 같은 날짜)보다 몇 일 더(음수면 덜) 했는지. 지난달 기록이 없으면 null.
   *
   * 지난달 전체와 비교하면 월초에는 늘 크게 모자라 보입니다(10월 1일에 "1일 · -24일"). 같은 날수끼리 비교합니다.
   */
  diffFromLastMonth: number | null
}

export type Streak = {
  /** 오늘(또는 어제)까지 이어진 연속 일수. 끊겼으면 0 */
  current: number
  best: number
}

/** 최근 리포트 행 왼쪽의 네모 아이콘(BE · FE · 인성)을 고르는 값입니다 */
export type InterviewKind = 'BACKEND' | 'FRONTEND' | 'PERSONALITY' | 'OTHER'

export type RecentReport = {
  reportId: string
  title: string
  kind: InterviewKind
  /** 면접 본 날 (YYYY-MM-DD) */
  practicedOn: string
  questionCount: number
  durationSec: number
  score: number
}

/** 배지 색. 토큰의 badge 의미 5종과 같습니다 (docs/design-system.md §2.4) */
export type BadgeTone = 'brand' | 'warning' | 'danger' | 'info' | 'success'

/** `badge.badge_code` (Cue-A/backend docs/02-database.md). 시안에 나오는 다섯 개만 그립니다 */
export type BadgeCode = 'FIRST_SESSION' | 'STREAK_3' | 'PRESSURE_CLEAR' | 'RISING' | 'TEN_SESSIONS'

export type HomeBadge = {
  code: BadgeCode
  name: string
  description: string
  tone: BadgeTone
  earned: boolean
}

export type BadgeSummary = {
  earnedCount: number
  totalCount: number
  /** 홈에 보여줄 배지. 아직 못 딴 것도 들어 있습니다(`earned: false`) */
  featured: HomeBadge[]
  /** "다음 뱃지까지 연습 2회 남았어요" 같은 안내. 줄 게 없으면 null */
  nextHint: string | null
}

export type WeeklyGoal = {
  title: string
  target: number
  done: number
}

export type UpcomingEvent = {
  eventId: string
  title: string
  /** 날짜 (YYYY-MM-DD) */
  date: string
  /** 시각 (HH:mm). 서류 마감처럼 하루 종일인 일정이면 null */
  time: string | null
}

export type HomeOverview = {
  thisMonth: MonthlyActivity
  streak: Streak
  /** 최근 것부터 */
  recentReports: RecentReport[]
  badges: BadgeSummary
  /** 이번 주 목표를 안 정했으면 null */
  weeklyGoal: WeeklyGoal | null
  /** 가까운 것부터. 지난 일정은 빠져 있습니다 */
  upcomingEvents: UpcomingEvent[]
  /** 기업별 인재상 키워드 */
  talentKeywords: string[]
  /** 질문은행에서 많이 보는 질문 */
  popularQuestions: string[]
}

/* ---------------------------------------------------------------------------
 * 기간 탭에 따라 바뀌는 묶음 — `GET /api/home/practice?period=10w`
 * ------------------------------------------------------------------------- */

export type ActivityDay = {
  /** YYYY-MM-DD */
  date: string
  /** 그날 연습 횟수. 0 이면 쉰 날 */
  count: number
}

/**
 * 점수 추이의 한 점입니다.
 *
 * 4주 · 10주는 **회차 하나**가 한 점이고, 6개월 · 1년은 회차가 너무 많아서 **한 달 평균**이 한 점입니다.
 */
export type ScorePoint = {
  /** 점 위에 올렸을 때 보여줄 이름. "9월 28일" · "2026년 9월" */
  label: string
  score: number
}

export type ScoreTrend = {
  unit: 'session' | 'month'
  /** 오래된 것부터 */
  points: ScorePoint[]
}

export type PracticeRecord = {
  period: PracticePeriod
  /** 기간 첫날 · 마지막 날 (YYYY-MM-DD) */
  startDate: string
  endDate: string
  /** startDate 부터 endDate 까지 하루도 빠짐없이 */
  days: ActivityDay[]
  totalCount: number
  activeDays: number
  /** 기간 안 점수 평균 · 최고. 연습이 없으면 null */
  averageScore: number | null
  bestScore: number | null
  trend: ScoreTrend
}
