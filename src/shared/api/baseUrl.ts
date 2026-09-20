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

/**
 * 일부 도메인만 실제로 붙이는 중인데 주소가 비어 있으면 **바로 멈춥니다.**
 *
 * `VITE_REAL_APIS` 를 쓰고 있다는 건 로컬에서 백엔드를 띄워놓고 붙이는
 * 상황이라는 뜻이고, 그때 주소가 비어 있으면 100% 설정 실수입니다.
 * 조용히 현재 origin 으로 나가게 두면 "왜 안 되지" 로 시간을 씁니다.
 *
 * 전부 실제로 붙이는 경우(`VITE_USE_MOCK=false`)는 막지 않습니다. 프론트와
 * 백엔드가 같은 주소에 올라가는 배포가 정상적으로 이 모양입니다.
 */
export function assertBaseUrl(usingPartialReal: boolean, path: string) {
  if (!usingPartialReal || API_BASE_URL) return

  const message =
    `VITE_API_BASE_URL 이 비어 있습니다. VITE_REAL_APIS 로 실제 서버에 붙이는 중이라면 ` +
    `백엔드 주소를 .env.local 에 적어주세요 (예: http://localhost:8080). ` +
    `비워두면 요청이 개발 서버로 나가서 엉뚱한 응답을 받습니다. 경로=${path}`

  console.error(message)
  throw new Error(message)
}
