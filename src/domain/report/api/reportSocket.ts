import { isBaseUrlMissing, WS_BASE_URL } from '@/shared/api/baseUrl'
import { isRealApi, mockFor, USING_PARTIAL_REAL } from '@/shared/api/mock'

import type { ReportDonePush, ReportErrorPush, ReportProgressPush } from '../types/analysis'

import { reportRequestPath } from './reportRequestApi'
import { connectMockReportSocket, type ReportSocketHandlers } from './reportRequestMock'
import { reportRetryPath } from './reportRetryApi'
import { connectMockRetrySocket } from './reportRetryMock'

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

  return openReportSocket(reportId, handlers)
}

/**
 * 부분 재시도의 진행 상황과 결과를 받습니다.
 *
 * ⚠️ 재시도 API 가 백엔드에 아직 없어서 **분석 등록과 같은 소켓 · 같은 메시지로 온다고 가정**했습니다
 * (`reportRetryApi.ts`). 재시도도 같은 reportId 의 리포트를 다시 만드는 일이라 백엔드 폴러를 그대로 쓸 가능성이
 * 높지만, 정해지면 다시 맞춥니다.
 *
 * 실제로 붙일지는 **재시도 등록을 누가 받았는지**로 정합니다. 등록을 목업이 받았는데 소켓만 실제 서버에 붙으면
 * 서버는 그 재시도를 모르니 아무것도 오지 않습니다. 재시도 API 는 `missingInBackend` 라 `reports` 를 실제로
 * 켜도 목업이 받으므로, 도메인 스위치(`isRealApi`)가 아니라 `mockFor` 로 봅니다.
 */
export function connectRetrySocket(reportId: string, handlers: ReportSocketHandlers): () => void {
  if (mockFor('POST', reportRetryPath(reportId))) {
    return connectMockRetrySocket(reportId, handlers)
  }

  return openReportSocket(reportId, handlers)
}

/** 실제 서버의 리포트 소켓을 엽니다. 반환값은 연결을 정리하는 함수입니다 */
function openReportSocket(reportId: string, handlers: ReportSocketHandlers): () => void {
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
