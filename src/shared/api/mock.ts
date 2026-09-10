import type { HttpMethod } from './types'

/**
 * 가짜 데이터 ↔ 실제 API 전환 스위치입니다.
 * `.env.local` 에서 VITE_USE_MOCK=true 로 켭니다.
 *
 * 백엔드가 언제 준비될지 우리가 정할 수 없어서, 화면 작업이 API 를
 * 기다리지 않도록 통로를 한 겹 둡니다. 실제 API 가 오면 이 스위치만 끕니다.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** 경로 파라미터를 받습니다. 예) '/api/reports/:reportId' → { reportId: 'r1' } */
type MockHandler = (params: Record<string, string>) => unknown

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
 * 계약 타입과 AI 더미 JSON 이전은 별도 이슈로 진행합니다.
 * 옛 레포의 fixtures 가 snake_case 라 그대로 옮기면 컨벤션(camelCase)과
 * 어긋나서, 백엔드 응답과 대조한 뒤에 옮기는 게 맞습니다.
 */
export function registerMock(method: HttpMethod, path: string, handler: MockHandler) {
  routes.push({ method, segments: toSegments(path), handler })
}

export function findMock(method: HttpMethod, path: string) {
  const actual = toSegments(path)

  for (const route of routes) {
    if (route.method !== method) continue

    const params = match(route.segments, actual)
    if (params) return () => route.handler(params)
  }

  return undefined
}

function toSegments(path: string) {
  return path.split('/').filter(Boolean)
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
