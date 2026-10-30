import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { toDateKey, toMonthKey } from '../lib/calendarDate'
import { MAX_EVENT_MEMO_LENGTH, MAX_EVENT_TITLE_LENGTH, WEEKLY_GOAL_OPTIONS } from '../lib/growthDisplay'

import type {
  CalendarEventCreateRequest,
  CalendarEventResponse,
  CalendarMonthResponse,
  GrowthOverviewResponse,
  WeeklyGoalResponse,
} from './growthResponse'

/**
 * 성장 관리 목업입니다. **백엔드에 컨트롤러가 없어서** `growth` · `calendar` 를 `VITE_REAL_APIS` 에 넣어도 목업이 답합니다.
 *
 * ## 시나리오
 *
 * - `sample` (기본) — 시안 그대로. 같은 면접을 5회차까지 봤고, 이번 주 목표 3회 중 2회
 * - `first` — 첫 회차만 본 사용자. 이전 회차 대비 변화가 비고, 이번 주 목표를 아직 안 정했습니다
 * - `empty` — 막 가입해서 아무 기록이 없는 사용자
 *
 * 주소 뒤에 `?mock=first` 처럼 붙여 바꿉니다. 고른 값은 이 탭(sessionStorage)에 남습니다 (홈 목업과 같은 방식).
 *
 * ## 날짜
 *
 * 시안의 8월을 그대로 박지 않고 **오늘 기준으로** 만듭니다. 연습한 날 · 면접 일정은 이번 달과 다음 달에 찍힙니다.
 *
 * 목표 수정 · 일정 등록은 메모리에만 남습니다. 새로고침하면 처음으로 돌아갑니다.
 */

const SCENARIO_KEY = 'cue-a:mock:growth'

type Scenario = 'sample' | 'first' | 'empty'

function currentScenario(): Scenario {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('mock')
    if (fromUrl === 'sample' || fromUrl === 'first' || fromUrl === 'empty') {
      sessionStorage.setItem(SCENARIO_KEY, fromUrl)
      return fromUrl
    }
    const stored = sessionStorage.getItem(SCENARIO_KEY)
    return stored === 'first' || stored === 'empty' ? stored : 'sample'
  } catch {
    // 저장소를 막아둔 브라우저면 기본값으로 갑니다. 목업 전환이 안 될 뿐 화면은 그려집니다.
    return 'sample'
  }
}

const MISSING = '성장 관리 API 없음 — growth · calendar 컨트롤러가 백엔드에 없음 (경로 · 응답 모양 프론트 임시안)'

const BADGES: GrowthOverviewResponse['badges'] = [
  { badgeCode: 'FIRST_SESSION', badgeName: '첫 연습', tone: 'brand', earnedAt: '2026-07-01T10:00:00+09:00' },
  { badgeCode: 'STREAK_3', badgeName: '3일 연속', tone: 'warning', earnedAt: '2026-07-03T10:00:00+09:00' },
  { badgeCode: 'PRESSURE_CLEAR', badgeName: '압박 극복', tone: 'danger', earnedAt: '2026-07-10T10:00:00+09:00' },
  { badgeCode: 'TEN_SESSIONS', badgeName: '10회 달성', tone: 'success', earnedAt: null },
]

const ROUND_CHANGE = [
  '4회차(78점) 대비 4점 올라 82점을 기록했어요. 내용 구성이 76점에서 84점으로 가장 크게 좋아졌고, 필러워드는 18회에서 9회로 절반 줄었습니다.',
  '반면 압박 질문 대응은 71점으로 5회차 중 가장 낮았고, 3회차에 한 번 떨어진 뒤 아직 회복되지 않았어요.',
  '다음 연습에서는 압박 강도를 유지한 채 결론부터 말하는 연습을 해보면 좋겠습니다.',
]

/** 목표 수정은 시나리오마다 따로 기억합니다. 시나리오를 바꿔도 앞서 고친 값이 섞이지 않게 */
const goalOverride = new Map<Scenario, number>()

function weeklyGoalOf(scenario: Scenario): WeeklyGoalResponse | null {
  const doneCount = scenario === 'sample' ? 2 : scenario === 'first' ? 1 : 0
  const target = goalOverride.get(scenario) ?? (scenario === 'sample' ? 3 : null)
  return target === null ? null : { targetValue: target, doneCount }
}

function buildOverview(scenario: Scenario): GrowthOverviewResponse {
  if (scenario === 'empty') {
    return {
      scoreRounds: null,
      weeklyGoal: weeklyGoalOf(scenario),
      badges: BADGES.map((badge) => ({ ...badge, earnedAt: null })),
      roundChange: null,
    }
  }

  const scores = scenario === 'sample' ? [68, 72, 71, 78, 82] : [68]
  return {
    scoreRounds: {
      companyName: '네이버',
      jobRole: '기획 직무',
      rounds: scores.map((totalScore, index) => ({ round: index + 1, totalScore })),
    },
    weeklyGoal: weeklyGoalOf(scenario),
    badges: scenario === 'sample' ? BADGES : BADGES.map((badge, index) => (index === 0 ? badge : { ...badge, earnedAt: null })),
    roundChange: scenario === 'sample' ? ROUND_CHANGE : null,
  }
}

registerMock('GET', '/api/growth', () => buildOverview(currentScenario()), { missingInBackend: MISSING })

registerMock(
  'PATCH',
  '/api/growth/weekly-goal',
  (_params, body): WeeklyGoalResponse => {
    const raw = typeof body === 'object' && body !== null ? (body as { targetValue?: unknown }).targetValue : undefined
    if (typeof raw !== 'number' || !(WEEKLY_GOAL_OPTIONS as readonly number[]).includes(raw)) {
      throw new ApiError('INVALID_REQUEST', '이번 주 목표는 1~7회입니다')
    }

    const scenario = currentScenario()
    goalOverride.set(scenario, raw)
    const goal = weeklyGoalOf(scenario)
    if (!goal) throw new ApiError('UNKNOWN', '목업 목표를 만들지 못했습니다')
    return goal
  },
  { missingInBackend: MISSING },
)

/* ---------------------------------------------------------------------------
 * 캘린더
 * ------------------------------------------------------------------------- */

/** 오늘에서 `offset` 일 뒤(음수면 앞) 날짜 */
function dayFromToday(offset: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return date
}

function atTime(date: Date, hours: number, minutes = 0) {
  const copy = new Date(date)
  copy.setHours(hours, minutes, 0, 0)
  return copy.toISOString()
}

/** 처음 들어 있는 일정. 오늘 기준 이틀 전 · 나흘 뒤 · 3주 뒤 (시안의 14일 · 20일 자리, 3주 뒤는 다음 달 이동 확인용) */
function seedEvents(): CalendarEventResponse[] {
  return [
    {
      calendarEventId: 'mock-event-1',
      title: '네이버 1차 면접',
      scheduledAt: atTime(dayFromToday(-2), 14),
      timeSpecified: true,
      memo: '포트폴리오 3번 프로젝트 질문 대비',
    },
    {
      calendarEventId: 'mock-event-2',
      title: '카카오 서류 결과 발표',
      scheduledAt: atTime(dayFromToday(4), 0),
      timeSpecified: false,
      memo: null,
    },
    {
      calendarEventId: 'mock-event-3',
      title: '네이버 2차 면접',
      scheduledAt: atTime(dayFromToday(21), 10, 30),
      timeSpecified: true,
      memo: null,
    },
  ]
}

/** 시나리오별 일정. 등록하면 여기에 쌓입니다 */
const eventsByScenario = new Map<Scenario, CalendarEventResponse[]>()

function eventsOf(scenario: Scenario) {
  const existing = eventsByScenario.get(scenario)
  if (existing) return existing
  const created = scenario === 'empty' ? [] : seedEvents()
  eventsByScenario.set(scenario, created)
  return created
}

/** 연습한 날. 오늘로부터 며칠 전인지 (시안의 3 · 7 · 10 · 12일 자리) */
function practicedOffsets(scenario: Scenario) {
  if (scenario === 'empty') return []
  if (scenario === 'first') return [-1]
  return [-13, -9, -6, -4, -1, -30, -34]
}

registerMock(
  'GET',
  '/api/calendar',
  (_params, _body, query): CalendarMonthResponse => {
    const month = query.get('month') ?? ''
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new ApiError('INVALID_REQUEST', `달 형식은 YYYY-MM 입니다 (${month})`)
    }

    const scenario = currentScenario()
    const events = eventsOf(scenario)
      .filter((event) => toMonthKey(new Date(event.scheduledAt)) === month)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    const practicedDates = practicedOffsets(scenario)
      .map((offset) => toDateKey(dayFromToday(offset)))
      .filter((date) => date.startsWith(month))
      .sort()

    return { month, events, practicedDates }
  },
  { missingInBackend: MISSING },
)

registerMock(
  'POST',
  '/api/calendar/events',
  (_params, body): CalendarEventResponse => {
    const request = (typeof body === 'object' && body !== null ? body : {}) as Partial<CalendarEventCreateRequest>
    const title = typeof request.title === 'string' ? request.title.trim() : ''
    const memo = typeof request.memo === 'string' ? request.memo.trim() : null
    const scheduledAt = typeof request.scheduledAt === 'string' ? request.scheduledAt : ''

    if (!title || title.length > MAX_EVENT_TITLE_LENGTH) {
      throw new ApiError('INVALID_REQUEST', `일정 제목은 1~${MAX_EVENT_TITLE_LENGTH}자입니다`)
    }
    if (memo && memo.length > MAX_EVENT_MEMO_LENGTH) {
      throw new ApiError('INVALID_REQUEST', `메모는 ${MAX_EVENT_MEMO_LENGTH}자까지입니다`)
    }
    if (Number.isNaN(new Date(scheduledAt).getTime())) {
      throw new ApiError('INVALID_REQUEST', '날짜를 읽을 수 없습니다')
    }

    const event: CalendarEventResponse = {
      calendarEventId: crypto.randomUUID(),
      title,
      scheduledAt,
      timeSpecified: request.timeSpecified === true,
      memo: memo || null,
    }
    eventsOf(currentScenario()).push(event)
    return event
  },
  { missingInBackend: MISSING },
)
