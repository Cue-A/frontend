import { ApiError } from './apiError'

/**
 * 백엔드 주소입니다. REST 와 WebSocket 이 같은 값을 씁니다.
 *
 * 비어 있으면 요청이 **지금 페이지와 같은 주소**로 나갑니다. 프론트와 백엔드가
 * 한 주소에 올라가는 배포에서는 그게 맞지만, 로컬 연동에서는 개발 서버
 * (`localhost:5173`)로 가서 `index.html` 을 받아옵니다. 그러면 JSON 파싱이
 * 실패하면서 `HTTP_200` 같은 엉뚱한 에러가 뜨고, 원인을 찾는 데 한참 걸립니다.
 *
 * 소켓은 더 조용히 실패합니다. `new WebSocket('/ws/interviews/s1')` 은 브라우저가
 * 현재 origin 으로 풀어줘서 **주소가 틀렸다는 신호 없이** 그냥 안 붙습니다.
 * (PR #40 리뷰 2번)
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

/** REST 주소 앞에 붙는 값. */
export const REST_BASE_URL = API_BASE_URL

/** 소켓 주소 앞에 붙는 값. `http` → `ws`, `https` → `wss` 로 바꿉니다. */
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws')

/** 주소가 비었을 때 콘솔과 화면에 같이 쓰는 문구입니다. 고치는 방법까지 적습니다. */
const MISSING_BASE_URL_MESSAGE =
  `VITE_API_BASE_URL 이 비어 있습니다. VITE_REAL_APIS 로 실제 서버에 붙이는 중이라면 ` +
  `백엔드 주소를 .env.local 에 적어주세요 (예: http://localhost:8080). ` +
  `비워두면 요청이 개발 서버로 나가서 엉뚱한 응답을 받습니다.`

/**
 * 주소가 비어 있어서 요청을 보내면 안 되는 상황인지 봅니다.
 *
 * `VITE_REAL_APIS` 를 쓰고 있다는 건 로컬에서 백엔드를 띄워놓고 붙이는
 * 상황이라는 뜻이고, 그때 주소가 비어 있으면 100% 설정 실수입니다.
 * 조용히 현재 origin 으로 나가게 두면 "왜 안 되지" 로 시간을 씁니다.
 *
 * 전부 실제로 붙이는 경우(`VITE_USE_MOCK=false`)는 막지 않습니다. 프론트와
 * 백엔드가 같은 주소에 올라가는 배포가 정상적으로 이 모양입니다.
 *
 * 막는 방법은 호출부마다 다릅니다. REST 는 `assertBaseUrl` 로 던지면 훅의
 * catch 가 받지만, 소켓은 동기 호출이라 던지면 렌더 중에 터집니다. 그래서
 * 판정과 로그만 여기서 하고, 그 뒤 처리는 호출부가 고릅니다. (PR #55 리뷰)
 */
export function isBaseUrlMissing(usingPartialReal: boolean, path: string): boolean {
  if (!usingPartialReal || API_BASE_URL) return false

  console.error(`${MISSING_BASE_URL_MESSAGE} 경로=${path}`)
  return true
}

/**
 * REST 전용. 주소가 비어 있으면 요청을 보내기 전에 멈춥니다.
 *
 * `ApiError` 로 던집니다. 그냥 `Error` 면 훅의 catch 가 `instanceof ApiError`
 * 로 갈라서 폴백 문구("잠시 후 다시 시도해 주세요")만 뜨고, 고치는 방법이
 * 적힌 문구는 콘솔에만 남습니다. (PR #55 리뷰)
 */
export function assertBaseUrl(usingPartialReal: boolean, path: string) {
  if (!isBaseUrlMissing(usingPartialReal, path)) return

  throw new ApiError('CONFIG_MISSING_BASE_URL', MISSING_BASE_URL_MESSAGE)
}
