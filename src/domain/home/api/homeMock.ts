import { registerMock } from '@/shared/api/mock'

import { addDays, daysBetween, formatMonthDay, parseIsoDate, startOfToday, toIsoDate } from '../lib/homeDate'
import { isPracticePeriod, practicePeriodOf } from '../lib/practicePeriod'
import type { InterviewKind, PracticePeriod } from '../types/home'

import type { HomeOverviewResponse, PracticeRecordResponse } from './homeResponse'

/**
 * 홈 대시보드 목업입니다. **백엔드에 홈 API 가 없어서** `home` 을 `VITE_REAL_APIS` 에 넣어도 목업이 답합니다.
 *
 * ## 두 가지 상태
 *
 * - `sample` (기본) — 반년쯤 꾸준히 연습한 사용자. 숫자는 시안과 비슷하게 맞췄습니다.
 * - `empty` — 막 가입해서 아무 기록이 없는 사용자. 빈 화면 문구를 확인할 때 씁니다.
 *
 * 주소 뒤에 `?mock=empty` 또는 `?mock=sample` 을 붙여 바꿉니다. 고른 값은 이 탭(sessionStorage)에 남아서
 * 다른 화면에 갔다 와도 유지됩니다. 실제 서버라면 로그인한 사람에 따라 갈리겠지만 목업은 누가 로그인했는지
 * 모르니(토큰을 뜯어보지 않습니다) 이렇게 고릅니다.
 *
 * ## 날짜
 *
 * 시안의 날짜(8월)를 그대로 박지 않고 **오늘 기준으로** 만듭니다. 그래야 D-day 가 음수가 되거나 "최근 10주"
 * 잔디가 텅 비는 일이 없습니다. 같은 날에는 매번 같은 값이 나오도록 난수는 고정 시드로 뽑습니다.
 */

const SCENARIO_KEY = 'cue-a:mock:home'

type Scenario = 'sample' | 'empty'

function currentScenario(): Scenario {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('mock')
    if (fromUrl === 'empty' || fromUrl === 'sample') {
      sessionStorage.setItem(SCENARIO_KEY, fromUrl)
      return fromUrl
    }
    return sessionStorage.getItem(SCENARIO_KEY) === 'empty' ? 'empty' : 'sample'
  } catch {
    // 저장소를 막아둔 브라우저면 기본값으로 갑니다. 목업 전환이 안 될 뿐 화면은 그려집니다.
    return 'sample'
  }
}

/* ---------------------------------------------------------------------------
 * 연습 기록 만들기 (sample)
 * ------------------------------------------------------------------------- */

type PracticeSession = { date: string; score: number }

/** 고정 시드 난수 (mulberry32). 새로고침해도 잔디 모양이 바뀌지 않게 합니다 */
function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 연습을 시작한 지 며칠 됐는지. 1년 탭 앞쪽이 비어 보이게 반년 남짓으로 둡니다 */
const HISTORY_DAYS = 200

/** 최근 10주는 더 자주 했습니다. 시안의 "활동한 날 56일 / 70일" 과 비슷한 비율입니다 */
const RECENT_DAYS = 70
const RECENT_ACTIVE_RATE = 0.8
const EARLIER_ACTIVE_RATE = 0.55

/** 시안 점수 추이의 8점(71 → 91). 가장 최근 8회차 점수를 이 값으로 맞춥니다 */
const LATEST_SCORES = [71, 72, 78, 79, 84, 83, 85, 91]

/** 하루 연습 횟수 1 ~ 4 의 비율 */
function pickDailyCount(random: () => number) {
  const roll = random()
  if (roll < 0.35) return 1
  if (roll < 0.65) return 2
  if (roll < 0.85) return 3
  return 4
}

/**
 * 오늘에서 거꾸로 `offset` 일 전에 연습했는지. 연속 기록 카드가 시안처럼 보이도록 몇 군데는 정해 둡니다.
 *
 * - 오늘 포함 4일 연속, 그 전날은 쉼 → "4일째"
 * - 105 ~ 120일 전 16일 연속 → "최고 16일" (난수로 더 긴 줄이 생기면 그게 최고가 됩니다)
 */
function forcedActivity(offset: number): boolean | undefined {
  if (offset <= 3) return true
  if (offset === 4) return false
  if (offset >= 105 && offset <= 120) return true
  if (offset === 104 || offset === 121) return false
  return undefined
}

function buildSampleSessions(today: Date): PracticeSession[] {
  const random = seededRandom(20260826)
  const sessions: PracticeSession[] = []

  for (let offset = HISTORY_DAYS - 1; offset >= 0; offset -= 1) {
    const rate = offset < RECENT_DAYS ? RECENT_ACTIVE_RATE : EARLIER_ACTIVE_RATE
    const rolled = random() < rate
    const active = forcedActivity(offset) ?? rolled
    if (!active) continue

    const date = toIsoDate(addDays(today, -offset))
    const count = pickDailyCount(random)
    for (let i = 0; i < count; i += 1) sessions.push({ date, score: 0 })
  }

  // 처음엔 60점 언저리에서 시작해 조금씩 오르게 합니다.
  const last = sessions.length - 1
  sessions.forEach((session, index) => {
    const progress = last === 0 ? 1 : index / last
    const noise = (random() - 0.5) * 12
    session.score = Math.round(Math.min(98, Math.max(45, 60 + 22 * progress + noise)))
  })

  LATEST_SCORES.forEach((score, index) => {
    const target = sessions.length - LATEST_SCORES.length + index
    if (target >= 0) sessions[target].score = score
  })

  return sessions
}

function sessionsFor(scenario: Scenario, today: Date): PracticeSession[] {
  return scenario === 'empty' ? [] : buildSampleSessions(today)
}

/** 날짜별 횟수 */
function countByDate(sessions: PracticeSession[]) {
  const counts = new Map<string, number>()
  sessions.forEach(({ date }) => counts.set(date, (counts.get(date) ?? 0) + 1))
  return counts
}

function average(scores: number[]) {
  if (scores.length === 0) return null
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

/* ---------------------------------------------------------------------------
 * GET /api/home
 * ------------------------------------------------------------------------- */

/** 최근 리포트 행에 붙일 면접 이름. 최근 것부터 이 순서로 붙입니다 (시안의 세 줄) */
const REPORT_TEMPLATES: Array<{ title: string; kind: InterviewKind; questionCount: number; durationSec: number }> = [
  { title: '프론트엔드 개발자 면접', kind: 'FRONTEND', questionCount: 5, durationSec: 12 * 60 },
  { title: '백엔드 개발자 면접', kind: 'BACKEND', questionCount: 8, durationSec: 18 * 60 },
  { title: '인성 면접 시뮬레이션', kind: 'PERSONALITY', questionCount: 6, durationSec: 15 * 60 },
]

/** 리포트 목업(`/api/reports/:reportId`)은 목록에 없는 id 도 받아줍니다. 눌러서 리포트 화면까지 이어집니다 */
const REPORT_ID_PREFIX = 'c2a7e5d0-3f41-4b8e-9d62-1a0b7c4e5f0'

const FEATURED_BADGES = [
  { badgeCode: 'FIRST_SESSION', badgeName: '첫 연습', description: '첫 면접 완료', tone: 'brand' },
  { badgeCode: 'STREAK_3', badgeName: '3일 연속', description: '스트릭 3일', tone: 'warning' },
  { badgeCode: 'PRESSURE_CLEAR', badgeName: '압박 극복', description: '매운맛 완주', tone: 'danger' },
  { badgeCode: 'RISING', badgeName: '우상향', description: '3회 연속 상승', tone: 'info' },
  { badgeCode: 'TEN_SESSIONS', badgeName: '10회 달성', description: '누적 10회', tone: 'success' },
] as const

const TOTAL_BADGE_COUNT = 12

/** 사용자와 상관없는 공용 목록이라 빈 상태에서도 그대로 보여줍니다 */
const TALENT_KEYWORDS = ['도전과 신뢰', '리더십 & 탐구', '실용주의', '데이터 중심']
const POPULAR_QUESTIONS = ['기술 스택 선택 이유', '협업 경험은?', '지원 동기']

/** 이번 달 1일 ~ 오늘, 그리고 지난달 같은 기간(1일 ~ 같은 날짜, 지난달이 짧으면 말일까지)의 연습한 날 수 */
function monthlyActivity(counts: Map<string, number>, today: Date) {
  const thisMonthStart = toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1))
  const lastMonthStart = toIsoDate(new Date(today.getFullYear(), today.getMonth() - 1, 1))
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
  const lastMonthSameDay = toIsoDate(
    new Date(today.getFullYear(), today.getMonth() - 1, Math.min(today.getDate(), lastMonthEnd.getDate())),
  )
  const todayIso = toIsoDate(today)

  let activeDays = 0
  let lastMonthActiveDays = 0
  let hasLastMonth = false
  counts.forEach((_count, date) => {
    if (date >= thisMonthStart && date <= todayIso) activeDays += 1
    if (date >= lastMonthStart && date <= lastMonthSameDay) lastMonthActiveDays += 1
    if (date >= lastMonthStart && date < thisMonthStart) hasLastMonth = true
  })

  return {
    month: today.getMonth() + 1,
    activeDays,
    diffFromLastMonth: hasLastMonth ? activeDays - lastMonthActiveDays : null,
  }
}

function streakOf(counts: Map<string, number>, today: Date) {
  // 오늘 아직 안 했어도 어제까지 이어졌으면 끊긴 게 아닙니다.
  let cursor = counts.has(toIsoDate(today)) ? today : addDays(today, -1)
  let currentDays = 0
  while (counts.has(toIsoDate(cursor))) {
    currentDays += 1
    cursor = addDays(cursor, -1)
  }

  const dates = [...counts.keys()].sort()
  let bestDays = 0
  let run = 0
  dates.forEach((date, index) => {
    const continues = index > 0 && daysBetween(parseIsoDate(dates[index - 1]), parseIsoDate(date)) === 1
    run = continues ? run + 1 : 1
    bestDays = Math.max(bestDays, run)
  })

  return { currentDays, bestDays }
}

function buildOverview(scenario: Scenario): HomeOverviewResponse {
  const today = startOfToday()
  const sessions = sessionsFor(scenario, today)
  const counts = countByDate(sessions)
  const isEmpty = sessions.length === 0

  const recentReports = sessions
    .slice(-REPORT_TEMPLATES.length)
    .reverse()
    .map((session, index) => ({
      reportId: `${REPORT_ID_PREFIX}${index + 1}`,
      title: REPORT_TEMPLATES[index].title,
      interviewKind: REPORT_TEMPLATES[index].kind,
      practicedOn: session.date,
      questionCount: REPORT_TEMPLATES[index].questionCount,
      durationSec: REPORT_TEMPLATES[index].durationSec,
      totalScore: session.score,
    }))

  return {
    thisMonth: monthlyActivity(counts, today),
    streak: streakOf(counts, today),
    recentReports,
    badges: {
      earnedCount: isEmpty ? 0 : FEATURED_BADGES.length,
      totalCount: TOTAL_BADGE_COUNT,
      featured: FEATURED_BADGES.map((badge, index) => ({
        ...badge,
        earnedAt: isEmpty ? null : toIsoDate(addDays(today, -(HISTORY_DAYS - 1) + index * 30)),
      })),
      nextHint: isEmpty ? '첫 면접을 마치면 첫 뱃지를 받아요' : '다음 뱃지까지 연습 2회 남았어요',
    },
    weeklyGoal: isEmpty ? null : { title: '이번 주 안에 까다로운 실전 면접 3번 보기', targetValue: 3, currentValue: 2 },
    upcomingEvents: isEmpty
      ? []
      : [
          { eventId: 'event-1', title: '1차 기술 면접', date: toIsoDate(addDays(today, 4)), time: '14:00' },
          { eventId: 'event-2', title: '서류 마감', date: toIsoDate(addDays(today, 10)), time: null },
        ],
    talentKeywords: TALENT_KEYWORDS,
    popularQuestions: POPULAR_QUESTIONS,
  }
}

/* ---------------------------------------------------------------------------
 * GET /api/home/practice?period=10w
 * ------------------------------------------------------------------------- */

/** 4주 · 10주 점수 추이에 찍는 회차 수. 시안이 "8회 전 ~ 최근" 입니다 */
const TREND_SESSION_COUNT = 8

/** 6개월 · 1년은 회차가 수백 개라 한 달 평균으로 찍습니다 */
function monthlyTrend(sessions: PracticeSession[]) {
  const byMonth = new Map<string, number[]>()
  sessions.forEach(({ date, score }) => {
    const key = date.slice(0, 7)
    byMonth.set(key, [...(byMonth.get(key) ?? []), score])
  })

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, scores]) => {
      const [year, month] = key.split('-').map(Number)
      return { label: `${year}년 ${month}월`, score: average(scores) ?? 0 }
    })
}

function buildPracticeRecord(scenario: Scenario, period: PracticePeriod): PracticeRecordResponse {
  const today = startOfToday()
  const { days: dayCount } = practicePeriodOf(period)
  const start = addDays(today, -(dayCount - 1))
  const startDate = toIsoDate(start)
  const endDate = toIsoDate(today)

  const sessions = sessionsFor(scenario, today).filter(({ date }) => date >= startDate && date <= endDate)
  const counts = countByDate(sessions)
  const scores = sessions.map(({ score }) => score)

  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = toIsoDate(addDays(start, index))
    return { date, count: counts.get(date) ?? 0 }
  })

  const byMonth = period === '6m' || period === '1y'

  return {
    period,
    startDate,
    endDate,
    days,
    totalCount: sessions.length,
    activeDays: counts.size,
    averageScore: average(scores),
    bestScore: scores.length === 0 ? null : Math.max(...scores),
    trend: byMonth
      ? { unit: 'month', points: monthlyTrend(sessions) }
      : {
          unit: 'session',
          points: sessions
            .slice(-TREND_SESSION_COUNT)
            .map(({ date, score }) => ({ label: formatMonthDay(date), score })),
        },
  }
}

const MISSING = '홈 대시보드 API 없음 — 경로 · 응답 모양 모두 프론트 임시안 (growth 컨트롤러 없음)'

registerMock('GET', '/api/home', () => buildOverview(currentScenario()), { missingInBackend: MISSING })

registerMock(
  'GET',
  '/api/home/practice',
  (_params, _body, query) => {
    const requested = query.get('period')
    const period = isPracticePeriod(requested) ? requested : '10w'
    return buildPracticeRecord(currentScenario(), period)
  },
  { missingInBackend: MISSING },
)
