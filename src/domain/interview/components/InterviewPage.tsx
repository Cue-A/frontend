import { useEffect, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import { toUserMessage } from '@/shared/api/errorMessage'

import { useInterviewSession } from '../hooks/useInterviewSession'
import { useInterviewSessionOptions } from '../hooks/useInterviewSessionOptions'
import { useMediaStream } from '../hooks/useMediaStream'
import { useQuestionAudio } from '../hooks/useQuestionAudio'
import type { InterviewSessionOptions } from '../api/sessionApi'
import type { DeviceStatus } from '../types/interview'
import type { MediaTrackFailureReason, MediaTrackState } from '../types/media'

import InterviewSessionPage from './InterviewSessionPage'

function InterviewStatusScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-50 p-6">
      <p className="text-h2 text-neutral-900">{message}</p>
    </div>
  )
}

const CAMERA_FAILURE_MESSAGE: Record<MediaTrackFailureReason, string> = {
  'permission-denied': '카메라 권한이 꺼져있어요',
  'not-found': '카메라를 찾을 수 없어요',
  'device-ended': '카메라 연결이 끊겼어요',
  unknown: '카메라를 확인할 수 없어요',
}

/** DeviceStatusChip 은 상단 오버레이용 요약 한 줄이라, 실패 이유별 문구는 SelfCameraPreview 쪽에 따로 둔다. */
function buildDeviceStatus(camera: MediaTrackState, mic: MediaTrackState): { status: DeviceStatus; message: string } {
  const cameraOk = camera.status === 'available'
  const micOk = mic.status === 'available'

  if (cameraOk && micOk) return { status: 'ok', message: '카메라 · 마이크 정상' }
  if (!micOk && !cameraOk) return { status: 'warning', message: '카메라 · 마이크를 확인해주세요' }
  if (!micOk) return { status: 'warning', message: '마이크 입력이 없어요' }
  return { status: 'warning', message: '카메라 화면이 안 보여요' }
}

/**
 * react-router 의 navigate state 는 타입이 없어(`unknown`) 형태를 신뢰하지 않고
 * 직접 좁힌다 (docs/01-conventions.md "any 를 쓰지 않습니다").
 */
function readInitialDeviceStatus(state: unknown): { camera: MediaTrackState; mic: MediaTrackState } | undefined {
  if (typeof state !== 'object' || state === null || !('initialDeviceStatus' in state)) return undefined

  const value = (state as { initialDeviceStatus?: unknown }).initialDeviceStatus
  if (typeof value !== 'object' || value === null || !('camera' in value) || !('mic' in value)) return undefined

  return value as { camera: MediaTrackState; mic: MediaTrackState }
}

type ConnectedProps = {
  sessionId: string
  options: InterviewSessionOptions
}

/**
 * useInterviewSession 을 실제로 연결하는 자리. 첫 question 이 오기 전까지는
 * InterviewSessionPage 가 요구하는 question prop 을 채울 수 없어 대기 화면을 보여준다.
 */
function ConnectedInterviewSession({ sessionId, options }: ConnectedProps) {
  const location = useLocation()
  const initialDeviceStatus = readInitialDeviceStatus(location.state)

  const session = useInterviewSession(sessionId, options.answerTimeLimitSec)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  if (!session.question) {
    return <InterviewStatusScreen message="첫 질문을 준비하는 중이에요..." />
  }

  const deviceStatus = buildDeviceStatus(camera, mic)

  return (
    <InterviewSessionPage
      videoRef={videoRef}
      // TODO(B-01-4): 종료 확인 모달·라우팅은 이 이슈 범위가 아니다.
      onExit={undefined}
      // TODO(B-01-4): REC 표시(경과 시간)는 녹화 시작 시점을 노출하는 후속 작업 몫이다.
      recordingElapsedSec={0}
      interviewerStyle={options.interviewerStyle}
      // TODO(B-01-4): 세션 전체 경과·제한 시간은 아직 이 이슈 범위가 아니다.
      sessionElapsedSec={0}
      sessionLimitSec={null}
      deviceStatus={deviceStatus.status}
      deviceStatusMessage={deviceStatus.message}
      speakingIntensity={amplitude}
      hasCameraStream={camera.status === 'available'}
      cameraFailureMessage={camera.status === 'failed' && camera.failureReason ? CAMERA_FAILURE_MESSAGE[camera.failureReason] : null}
      onAudioElement={setAudioElement}
      // 실시간 자막은 범위 제외가 확정 사항이다(백엔드 WS 메시지에 발화 전사 채널이 없음) —
      // LiveCaptionPanel 은 B-01-1 의 빈 상태 UI를 그대로 쓴다.
      caption={null}
      question={session.question}
      hideQuestionText={options.hideQuestionText}
      phase={session.phase}
      onSubmitAnswer={session.submitAnswer}
      progressLabel={session.progressLabel}
      needsRerecord={session.needsRerecord}
      submitError={session.submitError}
      remainingSec={session.remainingSec}
    />
  )
}

function InterviewSessionWithOptions({ sessionId }: { sessionId: string }) {
  const optionsResult = useInterviewSessionOptions(sessionId)

  if (optionsResult.status === 'loading') {
    return <InterviewStatusScreen message="면접 세션을 불러오는 중이에요..." />
  }

  if (optionsResult.status === 'error') {
    return <InterviewStatusScreen message={toUserMessage(optionsResult.error.code)} />
  }

  return <ConnectedInterviewSession sessionId={sessionId} options={optionsResult.options} />
}

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()

  if (!sessionId) {
    return <InterviewStatusScreen message="잘못된 면접 세션 주소예요." />
  }

  return <InterviewSessionWithOptions sessionId={sessionId} />
}
