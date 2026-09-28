import { isBaseUrlMissing, WS_BASE_URL } from '@/shared/api/baseUrl'
import { isRealApi, USING_PARTIAL_REAL } from '@/shared/api/mock'

import type { ReportDonePush, ReportErrorPush, ReportProgressPush } from '../types/analysis'

import { reportRequestPath } from './reportRequestApi'
import { connectMockReportSocket, type ReportSocketHandlers } from './reportRequestMock'

export type { ReportSocketHandlers }

const SOCKET_PATH = (reportId: string) => `/ws/reports/${encodeURIComponent(reportId)}`

type WsEnvelope = { type: string; payload: unknown }

/**
 * 리포트 분석의 진행 상황과 결과를 받는 소켓입니다. 서버 → 클라이언트 push 만 옵니다. (Cue-A/backend#50)
 *
 * 면접 소켓(`sessionSocket.ts`)과 따로 둡니다. 경로 키가 sessionId 가 아니라 reportId 이고 메시지도 다릅니다.
 *
 * **실제로 붙일지는 소켓 경로가 아니라 등록 경로(`interviews`)로 정합니다.** 이 소켓의 reportId 는 등록 응답에서
 * 오므로, 등록이 실제 서버로 갔으면 소켓도 실제 서버여야 합니다. 소켓 경로(`reports`)로 정하면
 * `VITE_REAL_APIS=interviews` 일 때 실제 reportId 로 목업 소켓에 붙어서 목업 리포트로 넘어갑니다.
 *
 * 주의할 점
 * - **늦게 붙으면 지나간 메시지는 오지 않습니다.** 서버가 붙는 순간 현재 상태를 보내주지 않고, 상태 조회 API 도
 *   아직 없습니다(Cue-A/backend#48). 분석이 몇 분 걸려서 등록 직후 붙으면 대개 문제없지만, 새로고침 사이에
 *   끝나버린 리포트는 이 소켓으로 알 수 없습니다
 * - 연결 인증이 없습니다. 면접 소켓과 같은 수준입니다 (Cue-A/backend#3)
 * - 재연결하지 않습니다. 끊기면 로그만 남깁니다 (면접 소켓과 같음)
 *
 * 반환값은 연결을 정리하는 함수입니다.
 */
export function connectReportSocket(
  reportId: string,
  sessionId: string,
  handlers: ReportSocketHandlers,
): () => void {
  if (!isRealApi(reportRequestPath(sessionId))) {
    return connectMockReportSocket(reportId, handlers)
  }

  const path = SOCKET_PATH(reportId)

  // 동기 함수라 던지지 않고 연결만 포기합니다. 이유는 sessionSocket.ts 와 같습니다. (PR #55 리뷰)
  if (isBaseUrlMissing(USING_PARTIAL_REAL, path)) {
    return () => {}
  }

  const socket = new WebSocket(`${WS_BASE_URL}${path}`)

  socket.addEventListener('error', () => {
    console.error('리포트 WS 연결 오류 reportId=%s', reportId)
  })

  socket.addEventListener('close', (event) => {
    if (event.wasClean || event.code === 1000) return
    console.error('리포트 WS 연결 비정상 종료 reportId=%s code=%s reason=%s', reportId, event.code, event.reason)
  })

  socket.addEventListener('message', (event) => {
    let envelope: WsEnvelope
    try {
      envelope = JSON.parse(event.data as string) as WsEnvelope
    } catch {
      console.error('리포트 WS 메시지를 해석할 수 없습니다 reportId=%s', reportId)
      return
    }

    switch (envelope.type) {
      case 'progress':
        handlers.onProgress(envelope.payload as ReportProgressPush)
        break
      case 'report':
        handlers.onReport(envelope.payload as ReportDonePush)
        break
      case 'error':
        handlers.onError(envelope.payload as ReportErrorPush)
        break
      default:
        console.error('알 수 없는 리포트 WS 메시지 type=%s reportId=%s', envelope.type, reportId)
    }
  })

  return () => socket.close()
}
