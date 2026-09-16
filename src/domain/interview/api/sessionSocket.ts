import { USE_MOCK } from '@/shared/api/mock'

import type { ErrorPush, ProgressPush, Question, SessionEndPush } from '../types/interview'

import { connectMockSessionSocket, type SessionSocketHandlers } from './sessionSocketMock'

export type { SessionSocketHandlers }

const WS_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/^http/, 'ws')

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
  if (USE_MOCK) {
    return connectMockSessionSocket(sessionId, handlers)
  }

  const socket = new WebSocket(`${WS_BASE_URL}/ws/interviews/${sessionId}`)

  // 재연결 정책은 아직 없다 (docs/90-open-questions.md Q6a, 연결 인증도 미정).
  // 지금은 끊겨도 자동 재연결하지 않고, 최소한 조용히 삼키지 않도록 로그만 남긴다.
  socket.addEventListener('error', () => {
    console.error('WS 연결 오류 sessionId=%s', sessionId)
  })

  socket.addEventListener('close', (event) => {
    console.error('WS 연결 종료 sessionId=%s code=%s', sessionId, event.code)
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
