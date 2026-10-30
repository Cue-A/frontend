/**
 * 성장 관리(C-04) 화면 타입입니다.
 *
 * ⚠️ **백엔드에 성장 관리용 API 가 없습니다.** `growth`(Goal · Badge · UserBadge · Streak)와 `calendar`(CalendarEvent)
 * 엔티티만 있고 컨트롤러가 없어서(Cue-A/backend main, 2026-10-30 확인) 시안을 보고 프론트가 먼저 정한 모양입니다.
 * 서버 응답 모양은 `api/growthResponse.ts` 에 따로 두고 api 파일에서 옮겨 담습니다 (docs/01-conventions.md "타입").
 */

/* ---------------------------------------------------------------------------
 * 성장 요약 — `GET /api/growth`
 * ------------------------------------------------------------------------- */

/** 회차 막대 하나 */
export type ScoreRound = {
  /** 1 부터. 같은 면접을 다시 본 순서입니다 */
  round: number
  /** 종합 점수(0~100) */
  score: number
}

/**
 * 회차별 종합 점수 추이. **가장 최근에 연습한 면접 묶음**(다시 본 회차 체인) 하나입니다.
 * 시안에 묶음을 고르는 칸이 없어서 하나만 받습니다.
 */
export type ScoreRounds = {
  /** `네이버 · 기획 직무 면접` */
  title: string
  /** 회차 순서대로. 점수가 나온 회차만 들어 있습니다 */
  rounds: ScoreRound[]
}

export type WeeklyGoal = {
  /** 이번 주에 하기로 한 연습 횟수 */
  target: number
  /** 이번 주에 한 연습 횟수 */
  done: number
}

/** 배지 색. 토큰의 badge 의미 5종과 같습니다 (docs/design-system.md §2.4) */
export type BadgeTone = 'brand' | 'warning' | 'danger' | 'info' | 'success'

export type GrowthBadge = {
  /** `badge.badge_code`. 화면은 이 값으로 아이콘을 고르고, 모르는 값이면 기본 아이콘을 씁니다 */
  code: string
  name: string
  tone: BadgeTone
  /** 아직 못 딴 배지도 회색으로 보여줍니다 — 무엇을 하면 받는지 알 수 있게 */
  earned: boolean
}

export type GrowthOverview = {
  /** 점수가 나온 회차가 하나도 없으면 null */
  scoreRounds: ScoreRounds | null
  /** 이번 주 목표를 안 정했으면 null */
  weeklyGoal: WeeklyGoal | null
  badges: GrowthBadge[]
  /**
   * 이전 회차 대비 변화(GRW-2). 문단 단위입니다. 비교할 이전 회차가 없으면(첫 회차) null 입니다.
   * 서버가 만든 문장을 그대로 보여줍니다.
   */
  roundChange: string[] | null
}

/* ---------------------------------------------------------------------------
 * 면접 캘린더 — `GET /api/calendar?month=YYYY-MM`
 * ------------------------------------------------------------------------- */

/** 사용자가 직접 등록한 면접 일정 */
export type CalendarEvent = {
  eventId: string
  title: string
  /** YYYY-MM-DD (보는 사람의 날짜) */
  date: string
  /** HH:mm. 시간을 안 적었으면 null */
  time: string | null
  memo: string | null
}

export type CalendarMonth = {
  /** YYYY-MM */
  month: string
  /** 날짜 · 시간 순 */
  events: CalendarEvent[]
  /** 그 달에 연습한 날(YYYY-MM-DD). 연습 기록에서 자동으로 찍힙니다 — 사용자가 등록하지 않습니다 */
  practicedDates: string[]
}

/** 일정 등록 창에서 보내는 값 */
export type CalendarEventDraft = {
  title: string
  date: string
  time: string | null
  memo: string | null
}
