import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom'

import { ROUTES, toAnalyzing } from '@/app/routes'
import { toUserMessage } from '@/shared/api/errorMessage'

import { useAnswerRecording } from '../hooks/useAnswerRecording'
import { useInterviewSession } from '../hooks/useInterviewSession'
import { useInterviewSessionOptions } from '../hooks/useInterviewSessionOptions'
import { useMediaStream } from '../hooks/useMediaStream'
import { useQuestionAudio } from '../hooks/useQuestionAudio'
import type { InterviewSessionOptions } from '../api/sessionApi'
import type { DeviceStatus } from '../types/interview'
import type { MediaTrackFailureReason, MediaTrackState } from '../types/media'

import ExitConfirmModal from './ExitConfirmModal'
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
 * useInterviewSession · useMediaStream · useAnswerRecording · useQuestionAudio 를
 * 실제로 연결하는 자리. 첫 question 이 오기 전까지는 InterviewSessionPage 가 요구하는
 * question prop 을 채울 수 없어 대기 화면을 보여준다.
 */
function ConnectedInterviewSession({ sessionId, options }: ConnectedProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const initialDeviceStatus = readInitialDeviceStatus(location.state)
  const [isExitRequested, setIsExitRequested] = useState(false)

  const { camera, mic, videoStream, audioRecordingStream, videoRecordingStream } = useMediaStream(initialDeviceStatus)
  const { uploadStatus, startRecording, stopAndUpload } = useAnswerRecording(sessionId, audioRecordingStream, videoRecordingStream)

  // 녹화 업로드가 끝나야 실제 제출을 부를 수 있어서(아래 pendingSubmit effect 주석
  // 참고), 수동 제출·타임아웃 제출 둘 다 "제출 의도"만 여기 적어두고 stopAndUpload 를
  // 부른다. 업로드가 끝나면 pendingSubmit effect 가 실제 session.submitAnswer 를 부른다.
  const pendingSubmitRef = useRef<{ isTimeout: boolean } | null>(null)

  const handleAnswerTimeout = useCallback(
    (questionId: string) => {
      pendingSubmitRef.current = { isTimeout: true }
      stopAndUpload(questionId)
    },
    [stopAndUpload],
  )

  const session = useInterviewSession(sessionId, options.answerTimeLimitSec, handleAnswerTimeout)
  const { beginSubmit, submitAnswer, cancelSubmit } = session
  const { setAudioElement, amplitude } = useQuestionAudio(session.question, session.notifyPresentationDone)

  // 뒤로가기 등 인앱 이동으로 세션을 잃지 않도록 막는다(#26 — X 버튼·beforeunload 만으로는
  // 브라우저 뒤로가기가 안 잡혔다). "확인" 누른 직후의 navigate(ROUTES.LANDING) 호출도
  // 이 블로커 대상이라, ref 로 "방금 확인했다"를 동기적으로 알려서 그 navigate 까지
  // 다시 막히지 않게 한다 — state 로 하면 리렌더가 한 박자 늦어 navigate 호출 시점에는
  // 아직 이전 값을 본다.
  const hasConfirmedExitRef = useRef(false)
  const blocker = useBlocker(() => !session.isFinished && !hasConfirmedExitRef.current)

  const videoRef = useRef<HTMLVideoElement | null>(null)

  // videoStream 이 <video> 태그가 실제로 그려지기 전에(session.question 이 아직 null 일 때)
  // 먼저 도착할 수 있다 — getUserMedia 가 mock 의 첫 질문(약 400ms)보다 빨리 끝나는 경우다.
  // 그때는 videoRef.current 가 아직 null 이라 대입이 씹히고, videoStream 자체는 그 뒤로
  // 안 바뀌니 다시 시도할 계기가 없어서 화면이 계속 비게 된다. session.question 이 처음
  // 생기는 시점(= <video> 가 처음 마운트되는 시점)도 의존성에 넣어서, 그때 videoStream 이
  // 이미 준비돼 있으면 그 시점에 다시 대입한다.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream
    }
  }, [videoStream, session.question?.questionId])

  // 새 질문에서 'answering' 이 되면(재녹음으로 되돌아온 경우 포함) 녹화를 새로 시작한다.
  // startRecording 자체가 "스트림 없음/이미 녹화 중"을 걸러줘서 여기선 조건 없이 부른다.
  useEffect(() => {
    if (session.phase === 'answering') {
      startRecording()
    }
  }, [session.phase, session.question?.questionId, startRecording])

  // 진행 중에 새로고침·탭 닫기로 세션을 잃지 않도록 경고한다 (#26). 'finished' 이후에는
  // 더 잃을 진행 상황이 없어서 해제한다.
  useEffect(() => {
    if (session.isFinished) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [session.isFinished])

  // 정상 종료(session_end 수신)면 분석중 화면으로 보낸다 (#26). replace 를 쓰는 이유는
  // AnalyzingPage 의 같은 패턴과 동일 — 뒤로가기로 끝난 면접 화면에 돌아오지 않게 한다.
  useEffect(() => {
    if (!session.isFinished) return
    navigate(toAnalyzing(sessionId), { replace: true })
  }, [session.isFinished, sessionId, navigate])

  /**
   * // DECISION NEEDED (이슈 #54 "확정 안 된 것" 3번): 텍스트 답변 제출(session.phase)과
   * 녹화 업로드(uploadStatus)를 하나의 트랙으로 합칠지 아직 팀 확인 전이다. 실제 제출
   * REST(POST /api/interviews/{sessionId}/answers)가 audioObjectKey 를 필수로 요구해서
   * "제출은 됐는데 업로드만 실패"가 구조적으로 성립하지 않을 가능성이 있다 — 그래서
   * 지금은 안전한 쪽으로, 오디오 업로드가 끝나야(uploadStatus 'uploaded') 실제
   * session.submitAnswer 를 부르는 쪽으로 임시로 연결해뒀다. 업로드가 실패하면
   * 제출 자체를 하지 않고 cancelSubmit 으로 되돌린다(텍스트만이라도 보낼지는 결정 후
   * 반영). 최종 정책이 정해지면 이 effect 를 다시 봐야 한다.
   */
  useEffect(() => {
    const pending = pendingSubmitRef.current
    if (!pending) return

    if (uploadStatus.status === 'uploaded') {
      pendingSubmitRef.current = null
      submitAnswer({ audioObjectKey: uploadStatus.audioObjectKey, videoObjectKey: uploadStatus.videoObjectKey }, pending.isTimeout)
    } else if (uploadStatus.status === 'failed') {
      pendingSubmitRef.current = null
      cancelSubmit(uploadStatus.message)
    }
  }, [uploadStatus, submitAnswer, cancelSubmit])

  const handleSubmitAnswer = () => {
    if (!session.question) return

    beginSubmit()
    pendingSubmitRef.current = { isTimeout: false }
    stopAndUpload(session.question.questionId)
  }

  if (!session.question) {
    return <InterviewStatusScreen message="첫 질문을 준비하는 중이에요..." />
  }

  const deviceStatus = buildDeviceStatus(camera, mic)

  // X 버튼(isExitRequested)과 뒤로가기 등 인앱 이동 시도(blocker.state==='blocked')
  // 둘 다 같은 모달로 확인받는다.
  const isExitModalOpen = isExitRequested || blocker.state === 'blocked'

  const handleCancelExit = () => {
    setIsExitRequested(false)
    if (blocker.state === 'blocked') blocker.reset()
  }

  // #54 2-5: 프론트→백엔드 이탈(abort) 경로가 아직 없다(백엔드 이슈 대기). 그래서 지금은
  // 서버에 알리지 않고 화면만 벗어난다 — 세션은 서버에 IN_PROGRESS로 남는다. 경로가
  // 나오면 실제 이동 전에 abort 호출을 끼워 넣는 자리다.
  const handleConfirmExit = () => {
    setIsExitRequested(false)

    // 뒤로가기 등으로 막혔던 이동이면 원래 가려던 곳으로 그대로 보낸다 — 무조건
    // 랜딩으로 보내면 "뒤로가기" 의미가 사라진다.
    if (blocker.state === 'blocked') {
      blocker.proceed()
      return
    }

    hasConfirmedExitRef.current = true
    navigate(ROUTES.LANDING)
  }

  return (
    <>
      <InterviewSessionPage
        videoRef={videoRef}
        onExit={() => setIsExitRequested(true)}
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
        onSubmitAnswer={handleSubmitAnswer}
        progressLabel={session.progressLabel}
        needsRerecord={session.needsRerecord}
        submitError={session.submitError}
        remainingSec={session.remainingSec}
      />

      <ExitConfirmModal open={isExitModalOpen} onCancel={handleCancelExit} onConfirm={handleConfirmExit} />
    </>
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
