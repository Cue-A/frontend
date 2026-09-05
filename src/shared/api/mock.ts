import type { HttpMethod } from './types'

/**
 * 가짜 데이터 ↔ 실제 API 전환 스위치입니다.
 * `.env.local` 에서 VITE_USE_MOCK=true 로 켭니다.
 *
 * 백엔드가 언제 준비될지 우리가 정할 수 없어서, 화면 작업이 API 를
 * 기다리지 않도록 통로를 한 겹 둡니다. 실제 API 가 오면 이 스위치만 끕니다.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

type MockHandler = () => unknown

const handlers = new Map<string, MockHandler>()

function toKey(method: HttpMethod, path: string) {
  return `${method} ${path}`
}

/**
 * 목업 응답을 등록합니다. 각 도메인의 api/ 에서 호출하세요.
 *
 * 계약 타입과 AI 더미 JSON 이전은 별도 이슈로 진행합니다.
 * 옛 레포의 fixtures 가 snake_case 라 그대로 옮기면 컨벤션(camelCase)과
 * 어긋나서, 백엔드 응답과 대조한 뒤에 옮기는 게 맞습니다.
 */
export function registerMock(method: HttpMethod, path: string, handler: MockHandler) {
  handlers.set(toKey(method, path), handler)
}

export function findMock(method: HttpMethod, path: string): MockHandler | undefined {
  return handlers.get(toKey(method, path))
}
