import type { RefObject } from 'react'

import type { SubmitErrorState } from '../hooks/useInterviewSession'
import type { DeviceStatus, InterviewerStyle, Question, SessionPhase } from '../types/interview'

import DeviceStatusChip from './DeviceStatusChip'
import InterviewerAvatarStage from './InterviewerAvatarStage'
import InterviewTopBar from './InterviewTopBar'
import QuestionCard from './QuestionCard'
import SessionSidePanel from './SessionSidePanel'

type Props = {
  onExit?: () => void
  recordingElapsedSec: number
  interviewerStyle: InterviewerStyle
  sessionElapsedSec: number
  sessionLimitSec: number | null

  deviceStatus: DeviceStatus
  deviceStatusMessage: string

  speakingIntensity: number

  videoRef: RefObject<HTMLVideoElement | null>
  hasCameraStream: boolean
  cameraFailureMessage?: string | null
  caption: string | null

  /** 질문 음성 <audio> 에 물릴 콜백 ref. useQuestionAudio 가 준다. */
  onAudioElement?: (element: HTMLAudioElement | null) => void

  question: Question
  hideQuestionText: boolean
  phase: SessionPhase
  onSubmitAnswer?: () => void
  progressLabel?: string | null
  needsRerecord?: boolean
  submitError?: SubmitErrorState | null
  remainingSec?: number | null
  /** 답변 녹화 업로드가 실패했을 때만 보여줄 문구. 정상/업로드 중엔 null. */
  recordingFailureMessage?: string | null
}

/**
 * 면접 진행 화면의 정적 UI 조립입니다. 내부 상태·타이머·미디어 접근이 없고
 * 모든 값은 props 로만 받는다 (B-01). phase 관리(B-01-2), 실제 미디어/오디오 연결(B-01-3),
 * 종료 모달·라우팅(B-01-4)은 각각 다른 이슈에서 이 컴포넌트에 실데이터를 채워 넣는다.
 */
export default function InterviewSessionPage({
  onExit,
  recordingElapsedSec,
  interviewerStyle,
  sessionElapsedSec,
  sessionLimitSec,
  deviceStatus,
  deviceStatusMessage,
  speakingIntensity,
  videoRef,
  hasCameraStream,
  cameraFailureMessage = null,
  caption,
  onAudioElement,
  question,
  hideQuestionText,
  phase,
  onSubmitAnswer,
  progressLabel = null,
  needsRerecord = false,
  submitError = null,
  remainingSec = null,
  recordingFailureMessage = null,
}: Props) {
  return (
    // min-w: SessionSidePanel(w-72 고정) + InterviewerAvatarStage 최소 공간을 함께 보장하는 임계값.
    // 반응형 레이아웃은 아직 설계되지 않았고(디자인 시안도 데스크톱 1장 기준), 이보다
    // 좁은 뷰포트는 시안 검증 대상이 아니다 — 요소가 겹치는 대신 가로 스크롤이 생기게 한다.
    <div className="flex min-h-screen min-w-5xl flex-col bg-neutral-50">
      <InterviewTopBar
        onExit={onExit}
        recordingElapsedSec={recordingElapsedSec}
        interviewerStyle={interviewerStyle}
        questionNumber={question.questionNumber}
        questionTotal={question.questionTotal}
        sessionElapsedSec={sessionElapsedSec}
        sessionLimitSec={sessionLimitSec}
      />

      {/*
        DeviceStatusChip · SessionSidePanel 은 절대배치 오버레이다. 아바타가 "사이드패널을
        제외한 남은 폭"이 아니라 화면 전체 폭·높이 기준으로 정중앙에 오게 하려면, 이 둘을
        문서 흐름에서 빼서 아바타 래퍼가 flex-1 공간을 전부 차지하게 해야 한다.
      */}
      <div className="relative flex flex-1 flex-col gap-4 px-24 pb-10">
        <div className="absolute left-16 top-12">
          <DeviceStatusChip status={deviceStatus} message={deviceStatusMessage} />
        </div>

        <div className="absolute right-16 top-12">
          <SessionSidePanel
            videoRef={videoRef}
            hasStream={hasCameraStream}
            cameraFailureMessage={cameraFailureMessage}
            caption={caption}
          />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <InterviewerAvatarStage speakingIntensity={speakingIntensity} />
        </div>

        {/* 질문 음성 재생 전용. 컨트롤은 안 보여주고 useQuestionAudio/useAudioAmplitude 가 소스·재생을 관리한다. */}
        <audio ref={onAudioElement} hidden />

        <QuestionCard
          question={question}
          hideQuestionText={hideQuestionText}
          phase={phase}
          onSubmitAnswer={onSubmitAnswer}
          progressLabel={progressLabel}
          needsRerecord={needsRerecord}
          submitError={submitError}
          remainingSec={remainingSec}
          recordingFailureMessage={recordingFailureMessage}
        />
      </div>
    </div>
  )
}
