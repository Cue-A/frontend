import { isBaseUrlMissing, WS_BASE_URL } from '@/shared/api/baseUrl'
import { isRealApi, USING_PARTIAL_REAL } from '@/shared/api/mock'

import type { ErrorPush, ProgressPush, Question, SessionEndPush } from '../types/interview'

import { connectMockSessionSocket, type SessionSocketHandlers } from './sessionSocketMock'

export type { SessionSocketHandlers }

/** 실제 소켓을 붙일지 목업을 돌릴지는 이 경로로 정합니다. (shared/api/mock.ts) */
const SOCKET_PATH = (sessionId: string) => `/ws/interviews/${sessionId}`

type WsEnvelope = { type: string; payload: unknown }

/**
 * 서버 → 클라이언트 push 전용 채널입니다. 답변 제출은 여기로 보내지 않고 REST로
 * 따로 보낸다(sessionApi.submitAnswer) — Spring 이 AI 를 폴링하고 결과만 이 소켓으로
 * 밀어주는 구조이기 때문이다 (docs/01-conventions.md "AI 대기 · 진행 상태").
 *
 * 경로(`/ws/interviews/{sessionId}`)와 `{ type, payload }` 봉투 파싱은 이 파일에만
 * 둔다. 이슈 #32 에서 경로가 바뀔 예정이라 여기만 고치면 된다.
 * 연결 인증은 아직 정해지지 않았다 (docs/90-open-questions.md Q6a) — 지금은 아무것도
 * 싣지 않는다.
 *
 * 반환값은 연결을 정리하는 함수다.
 */
export function connectSessionSocket(sessionId: string, handlers: SessionSocketHandlers): () => void {
  const path = SOCKET_PATH(sessionId)

  // REST 와 같은 스위치를 씁니다. 면접 도메인이 VITE_REAL_APIS 에 없으면
  // 소켓도 목업으로 돕니다 — 한쪽만 실제로 붙으면 질문은 오는데 답변 제출이
  // 404 가 나는 식으로 반쪽짜리가 됩니다. (이슈 #53)
  if (!isRealApi(path)) {
    return connectMockSessionSocket(sessionId, handlers)
  }

  // 주소가 비어 있으면 브라우저가 현재 origin 으로 풀어버려서, 틀렸다는 신호
  // 없이 조용히 안 붙습니다. (PR #40 리뷰 2번)
  //
  // 여기서 던지면 안 됩니다. REST 와 달리 이 함수는 동기라, 훅의 useEffect 안에서
  // 그대로 터져 면접 화면이 통째로 언마운트됩니다. 레포에 ErrorBoundary 가 없어서
  // 하얀 화면만 남고, 콘솔을 안 보면 단서가 없습니다 — 이 스위치가 없애려던
  // "원인을 못 찾는 상황" 이 더 나쁜 모양으로 돌아옵니다. 그래서 연결을 포기하고
  // 정리 함수만 돌려줍니다. (PR #55 리뷰)
  if (isBaseUrlMissing(USING_PARTIAL_REAL, path)) {
    return () => {}
  }

  const socket = new WebSocket(`${WS_BASE_URL}${path}`)

  // 재연결 정책은 아직 없다 (docs/90-open-questions.md Q6a, 연결 인증도 미정).
  // 지금은 끊겨도 자동 재연결하지 않고, 최소한 조용히 삼키지 않도록 로그만 남긴다.
  socket.addEventListener('error', () => {
    console.error('WS 연결 오류 sessionId=%s', sessionId)
  })

  socket.addEventListener('close', (event) => {
    // wasClean/code 1000 은 정상 종료다 — 화면 이탈로 우리가 socket.close() 를 부른
    // 경우가 대표적이고, 서버가 먼저 깨끗하게 닫는 경우도 포함한다. 에러로 찍지 않는다.
    if (event.wasClean || event.code === 1000) {
      console.debug('WS 연결 정상 종료 sessionId=%s code=%s', sessionId, event.code)
      return
    }

    console.error('WS 연결 비정상 종료 sessionId=%s code=%s reason=%s', sessionId, event.code, event.reason)
  })

  socket.addEventListener('message', (event) => {
    let envelope: WsEnvelope
    try {
      envelope = JSON.parse(event.data as string) as WsEnvelope
    } catch {
      console.error('WS 메시지를 해석할 수 없습니다 sessionId=%s', sessionId)
      return
    }

    switch (envelope.type) {
      case 'question':
        handlers.onQuestion(envelope.payload as Question)
        break
      case 'progress':
        handlers.onProgress(envelope.payload as ProgressPush)
        break
      case 'error':
        handlers.onError(envelope.payload as ErrorPush)
        break
      case 'session_end':
        handlers.onSessionEnd(envelope.payload as SessionEndPush)
        break
      default:
        // AI 파이프라인 원문 stage 값 등 스키마에 없는 type 이 오면 백엔드 버그다.
        console.error('알 수 없는 WS 메시지 type=%s sessionId=%s', envelope.type, sessionId)
    }
  })

  return () => socket.close()
}
