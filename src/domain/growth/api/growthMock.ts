import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { toDateKey, toMonthKey } from '../lib/calendarDate'
import { MAX_EVENT_MEMO_LENGTH, MAX_EVENT_TITLE_LENGTH, WEEKLY_GOAL_OPTIONS } from '../lib/growthDisplay'

import type {
  CalendarEventCreateRequest,
  CalendarEventResponse,
  CalendarMonthResponse,
  GrowthOverviewResponse,
  UpcomingEventListResponse,
  WeeklyGoalResponse,
} from './growthResponse'

/**
 * 성장 관리 목업입니다. 백엔드 응답 모양 그대로 돌려주고, `growth` · `calendar` 를 `VITE_REAL_APIS` 에 넣으면 실제 서버로
 * 갑니다 — 목표 Cue-A/backend#132, 배지 #134, 캘린더 #133 (모두 운영 배포 확인, 이슈 #201).
 *
 * 홈도 이 목업을 씁니다 — 이번 주 목표 · 배지(`/api/growth`)와 다가오는 면접일(`/api/calendar/events/upcoming`).
 * 라우터가 모든 화면을 처음에 불러와서 홈에서도 이 목업이 등록돼 있습니다. 두 화면의 숫자 · 일정이 늘 같습니다.
 *
 * ## 시나리오
 *
 * - `sample` (기본) — 시안 그대로. 같은 면접을 5회차까지 봤고, 이번 주 목표 3회 중 2회
 * - `first` — 첫 회차만 본 사용자. 이전 회차 대비 변화가 비고, 이번 주 목표를 아직 안 정했습니다
 * - `partial` — 1 · 2 · 4회차 (3회차는 리포트가 없어 빠지고, 2회차는 부분 리포트)
 * - `compare-error` — 회차 비교가 AI 서버 연결 실패(503)로 실패. 목표 · 배지 · 캘린더는 그대로 보입니다
 * - `compare-loose` — 회차 비교 응답에 값이 빠지거나 null 인 칸이 섞여 옴 (이슈 #140)
 * - `compare-empty` — 회차 비교 응답에 비교한 회차가 0개 (이슈 #140)
 * - `empty` — 막 가입해서 아무 기록이 없는 사용자
 *
 * 점수 추이 · 이전 회차 대비 변화는 리포트 도메인의 회차 비교 목업(`report/api/reportComparisonMock.ts`)이 답합니다.
 * 그 기준이 되는 가장 최근 리포트는 홈 목업(`home/api/homeMock.ts` 의 `/api/home/recent-reports?limit=1`)이 이 시나리오를
 * 읽어서 시나리오마다 회차 비교 목업이 알아보는 id 를 내려줍니다.
 *
 * 주소 뒤에 `?mock=first` 처럼 붙여 바꿉니다. 고른 값은 이 탭(sessionStorage)에 남습니다 (홈 목업과 같은 방식).
 *
 * ## 날짜
 *
 * 시안의 8월을 그대로 박지 않고 **오늘 기준으로** 만듭니다. 연습한 날 · 면접 일정은 이번 달과 다음 달에 찍힙니다.
 *
 * 목표 수정 · 일정 등록 · 수정 · 삭제는 메모리에만 남습니다. 새로고침하면 처음으로 돌아갑니다.
 */

const SCENARIO_KEY = 'cue-a:mock:growth'

const SCENARIOS = ['sample', 'first', 'partial', 'compare-error', 'compare-loose', 'compare-empty', 'empty'] as const

type Scenario = (typeof SCENARIOS)[number]

const isScenario = (value: string | null): value is Scenario => SCENARIOS.some((scenario) => scenario === value)

function currentScenario(): Scenario {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('mock')
    if (isScenario(fromUrl)) {
      sessionStorage.setItem(SCENARIO_KEY, fromUrl)
      return fromUrl
    }
    const stored = sessionStorage.getItem(SCENARIO_KEY)
    return isScenario(stored) ? stored : 'sample'
  } catch {
    // 저장소를 막아둔 브라우저면 기본값으로 갑니다. 목업 전환이 안 될 뿐 화면은 그려집니다.
    return 'sample'
  }
}

/**
 * 배지 다섯 개. 서버(Cue-A/backend#134)처럼 받지 않은 배지도 `earnedAt: null` 로 다 내려 주고, 이름 · 색도 서버 시드와 같습니다.
 * 홈 배지 카드도 이 응답을 씁니다 (이슈 #201 — 전에는 홈 목업에 따로 적어 두었습니다).
 */
const BADGES: GrowthOverviewResponse['badges'] = [
  { badgeCode: 'FIRST_SESSION', badgeName: '첫 연습', tone: 'brand', earnedAt: '2026-07-01T10:00:00+09:00' },
  { badgeCode: 'STREAK_3', badgeName: '3일 연속', tone: 'warning', earnedAt: '2026-07-03T10:00:00+09:00' },
  { badgeCode: 'PRESSURE_CLEAR', badgeName: '압박 극복', tone: 'danger', earnedAt: null },
  { badgeCode: 'RISING', badgeName: '우상향', tone: 'info', earnedAt: '2026-07-20T10:00:00+09:00' },
  { badgeCode: 'TEN_SESSIONS', badgeName: '10회 달성', tone: 'success', earnedAt: '2026-08-01T10:00:00+09:00' },
]

/** 목표 수정은 시나리오마다 따로 기억합니다. 시나리오를 바꿔도 앞서 고친 값이 섞이지 않게 */
const goalOverride = new Map<Scenario, number>()

function weeklyGoalOf(scenario: Scenario): WeeklyGoalResponse | null {
  const doneCount = scenario === 'empty' ? 0 : scenario === 'first' ? 1 : 2
  const target = goalOverride.get(scenario) ?? (scenario === 'empty' || scenario === 'first' ? null : 3)
  return target === null ? null : { targetValue: target, doneCount }
}

function buildOverview(scenario: Scenario): GrowthOverviewResponse {
  if (scenario === 'empty') {
    return {
      weeklyGoal: weeklyGoalOf(scenario),
      badges: BADGES.map((badge) => ({ ...badge, earnedAt: null })),
    }
  }

  return {
    weeklyGoal: weeklyGoalOf(scenario),
    badges: scenario === 'first' ? BADGES.map((badge, index) => (index === 0 ? badge : { ...badge, earnedAt: null })) : BADGES,
  }
}

/**
 * 이번 주 목표 · 배지. `growth` 를 켜면 실제 서버로 갑니다. 서버는 조회할 때 빠진 배지를 그 자리에서 지급하고 다섯 개를 다 줍니다.
 * 홈의 이번 주 목표 · 배지 칸도 이 응답을 씁니다 (이슈 #201).
 */
registerMock('GET', '/api/growth', () => buildOverview(currentScenario()))

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
)

/** 등록 · 수정 본문을 읽고 규칙을 봅니다. 맞지 않으면 `INVALID_REQUEST` 로 던집니다 */
function readEventRequest(body: unknown) {
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

  return { title, scheduledAt, timeSpecified: request.timeSpecified === true, memo: memo || null }
}

/** 이 시나리오의 일정 목록에서 그 일정의 자리. 없으면 `CALENDAR_EVENT_NOT_FOUND` 로 던집니다 */
function indexOfEvent(calendarEventId: string) {
  const index = eventsOf(currentScenario()).findIndex((event) => event.calendarEventId === calendarEventId)
  if (index < 0) throw new ApiError('CALENDAR_EVENT_NOT_FOUND', '일정을 찾을 수 없습니다')
  return index
}

registerMock(
  'POST',
  '/api/calendar/events',
  (_params, body): CalendarEventResponse => {
    const event: CalendarEventResponse = { calendarEventId: crypto.randomUUID(), ...readEventRequest(body) }
    eventsOf(currentScenario()).push(event)
    return event
  },
)

/** 일정 수정 (이슈 #190). 등록과 같은 네 칸을 받아 통째로 바꿉니다(PUT) */
registerMock(
  'PUT',
  '/api/calendar/events/:calendarEventId',
  ({ calendarEventId }, body): CalendarEventResponse => {
    const index = indexOfEvent(calendarEventId)
    const event: CalendarEventResponse = { calendarEventId, ...readEventRequest(body) }
    eventsOf(currentScenario())[index] = event
    return event
  },
)

/** 일정 삭제 (이슈 #190). 없는 일정은 404 — 서버처럼 다시 지워도 404 입니다 */
registerMock(
  'DELETE',
  '/api/calendar/events/:calendarEventId',
  ({ calendarEventId }) => {
    eventsOf(currentScenario()).splice(indexOfEvent(calendarEventId), 1)
  },
)

/** 홈 "다가오는 면접일" 의 기본 · 최대 개수. 서버와 같습니다 */
const DEFAULT_UPCOMING_LIMIT = 3
const MAX_UPCOMING_LIMIT = 10

/**
 * 다가오는 일정 (이슈 #201). 지금 이후의 일정만 가까운 순으로 `limit` 개(1~10, 비우면 3)입니다. 날짜만 있는 일정은 그날 00:00
 * 이라, 서버처럼 오늘 날짜만 있는 일정은 이미 지난 것으로 빠집니다. 날짜 · 시각은 보는 사람 기준으로 쪼갭니다.
 */
registerMock('GET', '/api/calendar/events/upcoming', (_params, _body, query): UpcomingEventListResponse => {
  const raw = query.get('limit')
  const limit = raw === null || raw === '' ? DEFAULT_UPCOMING_LIMIT : Number(raw)
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_UPCOMING_LIMIT) {
    throw new ApiError('INVALID_REQUEST', `limit 은 1~${MAX_UPCOMING_LIMIT} 입니다`)
  }

  const now = Date.now()
  const events = eventsOf(currentScenario())
    .filter((event) => new Date(event.scheduledAt).getTime() > now)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .slice(0, limit)
    .map((event) => {
      const at = new Date(event.scheduledAt)
      const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
      return {
        eventId: event.calendarEventId,
        title: event.title,
        date: toDateKey(at),
        time: event.timeSpecified ? time : null,
      }
    })

  return { events }
})
