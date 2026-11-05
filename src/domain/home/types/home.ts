/**
 * 홈 대시보드(A-04)에서 쓰는 화면 타입입니다.
 *
 * 백엔드 홈 API 는 셋입니다(Cue-A/backend#108 · #116). 이번 달 · 연속 학습은 `/api/home/stats`, 최근 리포트는
 * `/api/home/recent-reports`, 기간 탭에 따라 바뀌는 연습 기록은 `/api/home/practice` 입니다. 배지 · 이번 주 목표 ·
 * 다가오는 일정 · 인재상 · 질문은행은 백엔드에 아직 없어서 프론트 임시안(`/api/home`)을 목업이 답합니다.
 *
 * 서버 응답 모양은 `api/homeResponse.ts` 에 따로 두고 `api/homeApi.ts` 에서 옮겨 담습니다 —
 * 서버 필드가 바뀌어도 화면이 같이 흔들리지 않게 하려는 것입니다 (docs/01-conventions.md "타입").
 */

/** 연습 기록 카드의 기간 탭. 4주 · 10주 · 6개월 · 1년 (시안 mode-chips `1247:1709`) */
export type PracticePeriod = '4w' | '10w' | '6m' | '1y'

/* ---------------------------------------------------------------------------
 * 이번 달 · 연속 학습 — `GET /api/home/stats`
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

export type HomeStats = {
  thisMonth: MonthlyActivity
  streak: Streak
}

/* ---------------------------------------------------------------------------
 * 최근 리포트 — `GET /api/home/recent-reports`
 * ------------------------------------------------------------------------- */

/**
 * 최근 리포트 한 줄입니다. 볼 수 있는 리포트(완료 · 부분)만 옵니다.
 * 서버가 면접 종류 · 걸린 시간을 주지 않아서 시안의 "BE · FE · 인성" 아이콘과 "12분" 은 그리지 않습니다.
 */
export type RecentReport = {
  reportId: string
  /** 기업 · 직무. 기업을 고르지 않은 면접이면 직무만. 행 왼쪽 동그라미에는 이 첫 글자를 씁니다 */
  title: string
  /** 면접 본 날 (YYYY-MM-DD, 보는 사람 기준) */
  practicedOn: string
  /** 고른 문항 수. 되묻기는 세지 않습니다 */
  questionCount: number
  /** 종합 점수. 점수가 없는 리포트면 null */
  score: number | null
  /** 일부 항목이 빠진 리포트(PARTIAL)인지 */
  partial: boolean
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

/* ---------------------------------------------------------------------------
 * 백엔드에 아직 없는 것 — `GET /api/home` (프론트 임시안 · 목업)
 * ------------------------------------------------------------------------- */

export type HomeExtras = {
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
  /** 회차면 YYYY-MM-DD, 달이면 YYYY-MM */
  date: string
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
