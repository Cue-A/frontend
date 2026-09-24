import type { HttpMethod } from './types'

/**
 * 가짜 데이터 ↔ 실제 API 전환 스위치입니다.
 * `.env.local` 에서 VITE_USE_MOCK=true 로 켭니다.
 *
 * 백엔드가 언제 준비될지 우리가 정할 수 없어서, 화면 작업이 API 를
 * 기다리지 않도록 통로를 한 겹 둡니다.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/**
 * 목업을 켜둔 채로 **일부 도메인만** 실제 서버에 보냅니다.
 *
 * ```
 * VITE_USE_MOCK=true
 * VITE_REAL_APIS=auth,users
 * ```
 *
 * 백엔드는 엔드포인트를 한 번에 다 올리지 않습니다. 스위치가 전부 아니면
 * 전무이면, 로그인 하나 붙이려고 목업을 끄는 순간 아직 컨트롤러가 없는
 * 면접 · 리포트 · 기업이 전부 404 로 죽습니다. 그렇다고 켜두면 로그인도
 * 목업이라 연동 확인 자체가 안 됩니다.
 *
 * 그래서 준비된 도메인만 이 목록에 넣습니다. 백엔드가 면접을 올리면
 * `auth,users,interview-sessions` 로 한 줄 늘리면 됩니다.
 *
 * 비워두면 예전과 똑같이 전부 목업입니다. `VITE_USE_MOCK=false` 면 이
 * 목록과 관계없이 전부 실제 요청입니다. (이슈 #53)
 */
const REAL_APIS: string[] = (import.meta.env.VITE_REAL_APIS ?? '')
  .split(',')
  // 소문자로 눕힙니다. `VITE_REAL_APIS=Auth` 가 조용히 안 걸리면 .env 오타는
  // 찾기 어려운 축입니다 — 목업이 계속 도니까 화면은 멀쩡해 보입니다. (PR #55 리뷰)
  .map((name: string) => name.trim().toLowerCase())
  .filter(Boolean)

/** 목업을 켜둔 채 일부만 실제로 붙이는 중인지. 주소 검사에 씁니다. (baseUrl.ts) */
export const USING_PARTIAL_REAL = USE_MOCK && REAL_APIS.length > 0

/**
 * 접두어입니다. 도메인 이름을 찾을 때 건너뜁니다.
 *
 * 지금 접두어가 도메인마다 다릅니다 — 인증 · 사용자는 `/api`, 나머지는
 * `/v1` 이고, 소켓은 `/ws` 로 시작합니다. 아직 확정된 규칙이 아니라서
 * (이슈 #32 4번) 접두어를 건너뛰고 그 다음 조각을 도메인으로 봅니다.
 * 경로가 `/api/interviews` 에서 `/v1/interview-sessions` 로 바뀌어도
 * 이 파일은 그대로입니다.
 */
const PATH_PREFIXES = ['api', 'v1', 'ws']

/** 경로에서 도메인 이름 한 조각을 꺼냅니다. `/ws/v1/reports/x` → `reports` */
function domainOf(path: string): string | undefined {
  return toSegments(path).find((segment) => !PATH_PREFIXES.includes(segment))
}

/**
 * 이 경로를 실제 서버로 보낼지 정합니다.
 *
 * **도메인 조각 하나만** 봅니다. 경로 아무 데나 이름이 들어 있는지 보면
 * `/api/reports/auth` 처럼 **id 가 도메인 이름과 같을 때** 엉뚱하게 걸립니다.
 * 세션 id 는 AI 서버가 만든 문자열이라 값을 우리가 고르지 않습니다.
 *
 * ⚠️ **경로를 바꿀 때는 REST 와 소켓이 같은 조각을 갖는지 다시 확인하세요.**
 * 지금은 `/api/interviews` 와 `/ws/interviews/s1` 이 둘 다 `interviews` 라
 * 한 줄로 같이 켜지고 같이 꺼집니다. 그런데 REST 만 `/v1/interview-sessions`
 * 로 바뀌면(이슈 #32 4번) 도메인이 갈려서, 이 스위치가 막으려던 반쪽 상태가
 * 그대로 돌아옵니다 — 질문은 목업에서 오는데 답변 제출은 실제 서버로 갑니다.
 * (PR #55 리뷰)
 */
export function isRealApi(path: string): boolean {
  if (!USE_MOCK) return true
  if (REAL_APIS.length === 0) return false

  const domain = domainOf(path)
  return domain !== undefined && REAL_APIS.includes(domain)
}

/**
 * 경로 파라미터와 요청 본문, 쿼리를 받습니다.
 *   '/api/reports/:reportId' → params { reportId: 'r1' }
 *
 * body 는 POST · PATCH 처럼 보낸 값에 따라 응답이 달라져야 할 때 씁니다.
 * multipart 요청이면 `FormData` 그대로 옵니다.
 * query 는 `?documentType=RESUME` 처럼 목록을 거를 때 씁니다. 쿼리가 없어도
 * 빈 `URLSearchParams` 가 옵니다.
 * 안 쓰는 핸들러는 앞쪽 인자만 받으면 됩니다. (PR #8 리뷰)
 */
type MockHandler = (params: Record<string, string>, body: unknown, query: URLSearchParams) => unknown

type MockRoute = {
  method: HttpMethod
  segments: string[]
  handler: MockHandler
}

const routes: MockRoute[] = []

/**
 * 목업 응답을 등록합니다. 각 도메인의 api/ 에서 호출하세요.
 *
 * 경로에 `:이름` 을 쓰면 그 자리는 아무 값이나 받습니다.
 *   registerMock('GET', '/api/reports/:reportId', ({ reportId }) => ...)
 *
 * 보낸 값에 따라 응답이 달라져야 하면 두 번째 인자로 본문을 받습니다.
 *   registerMock('POST', '/api/interviews', (_params, body) => ...)
 *
 * 쿼리는 경로에 쓰지 않습니다. 경로는 `?` 앞까지만 맞춰보고, 쿼리는 세 번째 인자로 옵니다.
 *   registerMock('GET', '/api/documents', (_params, _body, query) => query.get('page'))
 *
 * 계약 타입과 AI 더미 JSON 이전은 별도 이슈로 진행합니다.
 * 옛 레포의 fixtures 가 snake_case 라 그대로 옮기면 컨벤션(camelCase)과
 * 어긋나서, 백엔드 응답과 대조한 뒤에 옮기는 게 맞습니다.
 */
export function registerMock(method: HttpMethod, path: string, handler: MockHandler) {
  routes.push({ method, segments: toSegments(path), handler })
}

export function findMock(method: HttpMethod, path: string) {
  const actual = toSegments(path)
  const query = new URLSearchParams(queryOf(path))

  for (const route of routes) {
    if (route.method !== method) continue

    const params = match(route.segments, actual)
    if (params) return (body?: unknown) => route.handler(params, body, query)
  }

  return undefined
}

/**
 * 쿼리를 떼고 나눕니다. 떼지 않으면 `/api/documents?page=0` 의 마지막 조각이
 * `documents?page=0` 이 되어 목업 경로와도, `VITE_REAL_APIS` 의 도메인 이름과도
 * 맞지 않습니다. 목업은 MOCK_NOT_FOUND 로 죽고, 실제 연동은 켜도 안 켜집니다.
 */
function toSegments(path: string) {
  return pathnameOf(path).split('/').filter(Boolean)
}

function pathnameOf(path: string) {
  const question = path.indexOf('?')
  return question < 0 ? path : path.slice(0, question)
}

function queryOf(path: string) {
  const question = path.indexOf('?')
  return question < 0 ? '' : path.slice(question + 1)
}

/** 맞으면 파라미터를, 안 맞으면 null 을 돌려줍니다. */
function match(pattern: string[], actual: string[]): Record<string, string> | null {
  if (pattern.length !== actual.length) return null

  const params: Record<string, string> = {}

  for (let i = 0; i < pattern.length; i += 1) {
    const expected = pattern[i]

    if (expected.startsWith(':')) {
      params[expected.slice(1)] = actual[i]
      continue
    }

    if (expected !== actual[i]) return null
  }

  return params
}
