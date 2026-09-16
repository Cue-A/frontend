import { useRef } from 'react'
import { useParams } from 'react-router-dom'

import { toUserMessage } from '@/shared/api/errorMessage'

import { useInterviewSession } from '../hooks/useInterviewSession'
import { useInterviewSessionOptions } from '../hooks/useInterviewSessionOptions'
import type { InterviewSessionOptions } from '../api/sessionApi'

import InterviewSessionPage from './InterviewSessionPage'

function InterviewStatusScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-50 p-6">
      <p className="text-h2 text-neutral-900">{message}</p>
    </div>
  )
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
  const session = useInterviewSession(sessionId, options.answerTimeLimitSec)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  if (!session.question) {
    return <InterviewStatusScreen message="첫 질문을 준비하는 중이에요..." />
  }

  return (
    <InterviewSessionPage
      videoRef={videoRef}
      // TODO(B-01-3): 실제 미디어 연결 전까지 종료 버튼 동작이 없다.
      onExit={undefined}
      // TODO(B-01-3): REC 표시는 실제 녹음 파이프라인이 붙기 전까지 placeholder다.
      recordingElapsedSec={0}
      interviewerStyle={options.interviewerStyle}
      // TODO(B-01-3/B-01-4): 세션 전체 경과·제한 시간은 아직 이 이슈 범위가 아니다.
      sessionElapsedSec={0}
      sessionLimitSec={null}
      // TODO(B-01-3): 장치 상태는 DeviceCheckPage 결과를 아직 이어받지 않는다.
      deviceStatus="ok"
      deviceStatusMessage=""
      speakingIntensity={0}
      hasCameraStream={false}
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
