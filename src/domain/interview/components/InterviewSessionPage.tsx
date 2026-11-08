import { useState, type RefObject } from 'react'

import type { SubmitErrorState } from '../hooks/useInterviewSession'
import type { InterviewerStyle, Question, SessionPhase } from '../types/interview'

import AnswerControlBar from './AnswerControlBar'
import InterviewerAvatarStage from './InterviewerAvatarStage'
import InterviewTopBar from './InterviewTopBar'
import QuestionCard from './QuestionCard'
import SessionSidePanel from './SessionSidePanel'

type Props = {
  onExit?: () => void
  /** 답변 녹화 시작 시각(epoch ms). 녹화 중이 아니면 null — REC 표시를 숨긴다. */
  recordingStartedAt: number | null
  interviewerStyle: InterviewerStyle
  /** 상단 "면접관 모드" 아래에 보여줄 설정 직무 · 기업. 없으면 그 줄을 숨긴다. */
  jobRole?: string | null
  companyName?: string | null
  /** 첫 질문 도착 시각(epoch ms). 면접 누적 시간의 기준이다. */
  sessionStartedAt: number | null
  isSessionFinished: boolean
  sessionLimitSec: number | null


  speakingIntensity: number

  videoRef: RefObject<HTMLVideoElement | null>
  hasCameraStream: boolean
  /** 마이크가 연결돼 있는지. 하단 독의 마이크 상태 표시에 쓴다. */
  isMicAvailable?: boolean
  cameraFailureMessage?: string | null
  caption: string | null
  captionSupported?: boolean

  /** 질문 음성 <audio> 에 물릴 콜백 ref. useQuestionAudio 가 준다. */
  onAudioElement?: (element: HTMLAudioElement | null) => void

  question: Question
  hideQuestionText: boolean
  phase: SessionPhase
  /** 면접관 아바타를 고르는 기준(세션 단위로 고정). */
  sessionId: string
  onSubmitAnswer?: () => void
  progressLabel?: string | null
  /** 답변 처리가 60초 넘게 걸리는 중인지. true 면 진행 문구 대신 지연 안내를 보여준다. */
  answerDelayed?: boolean
  needsRerecord?: boolean
  submitError?: SubmitErrorState | null
  remainingSec?: number | null
}

/**
 * 면접 진행 화면의 UI 조립입니다. 방사형 그라디언트 배경(`stage-*` 토큰, 이 화면 안에서만 쓴다) 기준이다.
 * 타이머·미디어 접근이 없고 값은 props 로만 받는다 (B-01). 자막 표시 on/off(CC 버튼)만 화면 안 상태다. phase 관리(B-01-2), 실제 미디어/오디오 연결(B-01-3),
 * 종료 모달·라우팅(B-01-4)은 각각 다른 이슈에서 이 컴포넌트에 실데이터를 채워 넣는다.
 */
/** 답변 업로드 중(서버 진행 단계가 오기 전)에 보여주는 문구. */
const SUBMITTING_LABEL = '답변 제출 중'

export default function InterviewSessionPage({
  onExit,
  recordingStartedAt,
  interviewerStyle,
  jobRole = null,
  companyName = null,
  sessionStartedAt,
  isSessionFinished,
  sessionLimitSec,
  speakingIntensity,
  videoRef,
  hasCameraStream,
  isMicAvailable = true,
  cameraFailureMessage = null,
  caption,
  captionSupported,
  onAudioElement,
  question,
  hideQuestionText,
  phase,
  sessionId,
  onSubmitAnswer,
  progressLabel = null,
  answerDelayed = false,
  needsRerecord = false,
  submitError = null,
  remainingSec = null,
}: Props) {
  const [captionVisible, setCaptionVisible] = useState(true)
  // 답변을 제출한 뒤에는 자막을 바로 숨기고 그 자리에 진행 문구를 보여준다. 진행 문구가 아직 안 왔으면(업로드 중) 기본 문구를 쓴다.
  const isSubmitted = phase === 'submitting' || phase === 'waitingNextQuestion'
  const loadingLabel = isSubmitted ? (phase === 'waitingNextQuestion' && progressLabel ? progressLabel : SUBMITTING_LABEL) : null

  return (
    // min-w: SessionSidePanel(최소 20rem) + InterviewerAvatarStage 최소 공간을 함께 보장하는 임계값.
    // 반응형 레이아웃은 아직 설계되지 않았고(디자인 시안도 데스크톱 1장 기준), 이보다
    // 좁은 뷰포트는 시안 검증 대상이 아니다 — 요소가 겹치는 대신 가로 스크롤이 생기게 한다.
    <div
      className="flex min-h-screen min-w-5xl flex-col bg-stage-bg bg-stage-gradient"
    >
      <InterviewTopBar
        onExit={onExit}
        recordingStartedAt={recordingStartedAt}
        interviewerStyle={interviewerStyle}
        jobRole={jobRole}
        companyName={companyName}
        questionNumber={question.questionNumber}
        questionTotal={question.questionTotal}
        sessionStartedAt={sessionStartedAt}
        isSessionFinished={isSessionFinished}
        sessionLimitSec={sessionLimitSec}
      />

      {/*
        SessionSidePanel 은 절대배치 오버레이다. 아바타가 "사이드패널을 제외한 남은 폭"이 아니라
        화면 전체 폭·높이 기준으로 정중앙에 오게 하려면, 이걸 문서 흐름에서 빼서
        아바타 래퍼가 flex-1 공간을 전부 차지하게 해야 한다.
      */}
      <div className="relative flex flex-1 flex-col gap-4 px-24 pb-8">
        <div className="absolute right-16 top-0">
          <SessionSidePanel
            videoRef={videoRef}
            hasStream={hasCameraStream}
            cameraFailureMessage={cameraFailureMessage}
          />
        </div>

        {/* items-end · -mb-4: 아바타 몸통 아래쪽이 위 gap-4 를 지나 QuestionCard 윗면에 바로 얹히게 한다. */}
        <div className="-mb-4 flex flex-1 items-end justify-center">
          <InterviewerAvatarStage speakingIntensity={speakingIntensity} sessionId={sessionId} phase={phase} interviewerStyle={interviewerStyle} />
        </div>

        {/* 질문 음성 재생 전용. 컨트롤은 안 보여주고 useQuestionAudio/useAudioAmplitude 가 소스·재생을 관리한다. */}
        {/* crossOrigin: 음성 파일(S3)이 다른 출처라서, 없으면 Web Audio 를 거친 소리가 무음이 된다(입뿐 아니라 질문 음성이 안 들린다). 지우지 말 것 — 저장소 CORS 헤더와 짝이다. */}
        <audio ref={onAudioElement} crossOrigin="anonymous" hidden />

        <QuestionCard
          question={question}
          hideQuestionText={hideQuestionText}
          sessionId={sessionId}
          showCaptionLine={captionVisible}
          loadingLabel={loadingLabel}
          delayed={answerDelayed && phase === 'waitingNextQuestion'}
          bookmarkHintEligible={(phase === 'presenting' || phase === 'answering') && question.questionNumber === 1}
          caption={caption}
          captionSupported={captionSupported}
        />

        <AnswerControlBar
          phase={phase}
          onSubmitAnswer={onSubmitAnswer}
          captionVisible={captionVisible}
          onToggleCaption={() => setCaptionVisible((visible) => !visible)}
          micOn={isMicAvailable}
          cameraOn={hasCameraStream}
          needsRerecord={needsRerecord}
          submitError={submitError}
          remainingSec={remainingSec}
        />
      </div>
    </div>
  )
}
