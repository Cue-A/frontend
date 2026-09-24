import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { submitAnswer as submitAnswerRequest } from '../api/sessionApi'
import { connectSessionSocket } from '../api/sessionSocket'
import type { AnswerSubmission, ErrorPush, ProgressPush, Question, SessionEndPush, SessionPhase } from '../types/interview'

const PROGRESS_STAGE_LABEL: Record<ProgressPush['stage'], string> = {
  TRANSCRIBING: '답변 정리 중',
  GENERATING: '질문 준비 중',
  SYNTHESIZING: '음성 만드는 중',
}

export type SubmitErrorState = {
  message: string
  retryable: boolean
}

/** 녹화 업로드(useAnswerRecording)가 끝난 뒤 나온 objectKey. submitAnswer 에 그대로 싣는다. */
export type AnswerRecordingKeys = {
  audioObjectKey: string
  videoObjectKey: string | null
}

export type UseInterviewSessionResult = {
  phase: SessionPhase
  question: Question | null
  /** waitingNextQuestion 단계에서 보여줄 진행 문구. 그 외 단계에서는 null. */
  progressLabel: string | null
  needsRerecord: boolean
  submitError: SubmitErrorState | null
  isFinished: boolean
  sessionEnd: SessionEndPush | null
  /** 질문당 남은 시간(초). answerTimeLimitSec 이 null 이면 제한 없음이라 항상 null. */
  remainingSec: number | null
  /**
   * 제출 시작 — 즉시 phase 를 'submitting' 으로 바꾼다(버튼 잠금 등). 녹화 업로드가
   * 끝나기 전에, 업로드를 시작하는 시점에 부른다.
   */
  beginSubmit: () => void
  /** 녹화 업로드가 끝난 뒤 objectKey 를 받아 실제 REST 제출을 한다. */
  submitAnswer: (recording: AnswerRecordingKeys, isTimeout: boolean) => void
  /**
   * 녹화 업로드가 실패했을 때 제출을 취소하고 다시 답변할 수 있는 상태로 되돌린다.
   * 실패 문구는 submitError 에 실어 보여준다 — submitError 는 beginSubmit·새 질문에서만
   * 지워지므로, 되돌아온 뒤 녹화가 다시 시작돼도(uploadStatus 가 'recording' 으로 바뀌어도)
   * 문구가 지워지지 않는다.
   */
  cancelSubmit: (message: string) => void
  /** 질문 제시(텍스트/오디오)가 끝났을 때 컨테이너가 부른다 — presenting → answering 전환. */
  notifyPresentationDone: (questionId: string) => void
}

/**
 * 면접 세션 진행(이슈 #24, B-01-2) 상태 머신입니다.
 * WS push(question/progress/error/session_end)를 받아 phase 를 굴리고, 답변 제출은
 * REST(sessionApi.submitAnswer)로 보낸다. 경로 · 페이로드 변환은 api/ 에만 두고 여기서는
 * 이미 정규화된 도메인 타입만 다룬다.
 *
 * 답변 제출이 beginSubmit/submitAnswer 둘로 나뉘어 있는 이유(이슈 #54 재작업, 2026-09-22):
 * 실제 제출 REST 는 녹화 업로드가 끝나야 나오는 audioObjectKey 를 필수로 요구한다.
 * 업로드는 이 훅 밖(InterviewPage.tsx 의 useAnswerRecording)에서 비동기로 일어나므로,
 * "제출 버튼을 눌렀다/타임아웃됐다"(beginSubmit, phase 만 즉시 'submitting')와
 * "objectKey 가 준비돼 실제로 REST 를 보낸다"(submitAnswer)를 분리했다.
 *
 * onAnswerTimeout 도 같은 이유로 콜백이 됐다 — 이 훅은 "지금 타임아웃으로 제출해야
 * 하는지" 정책(무응답이면 제출하지 않는다, 아래 INT-8 TODO)만 판단하고, 실제 녹화
 * 중단·업로드·제출은 컨테이너가 한다.
 */
export function useInterviewSession(
  sessionId: string,
  answerTimeLimitSec: number | null,
  onAnswerTimeout: (questionId: string) => void,
): UseInterviewSessionResult {
  const [phase, setPhase] = useState<SessionPhase>('presenting')
  const [question, setQuestion] = useState<Question | null>(null)
  const [progressLabel, setProgressLabel] = useState<string | null>(null)
  const [needsRerecord, setNeedsRerecord] = useState(false)
  const [submitError, setSubmitError] = useState<SubmitErrorState | null>(null)
  const [sessionEnd, setSessionEnd] = useState<SessionEndPush | null>(null)
  const [remainingSec, setRemainingSec] = useState<number | null>(answerTimeLimitSec)

  const phaseRef = useRef(phase)
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const questionRef = useRef<Question | null>(null)
  useEffect(() => {
    questionRef.current = question
  }, [question])

  const finishedRef = useRef(false)
  const answerStartRef = useRef(0)
  // TODO(B-01-3): STT 로 실시간 갱신되어야 한다. 지금은 AnswerControlBar 의
  // onSubmitAnswer 가 인자를 받지 않아 답변 텍스트를 캡처할 방법이 없어 항상 빈 문자열이다.
  const transcriptRef = useRef('')

  const handleQuestion = useCallback((next: Question) => {
    setQuestion(next)
    setProgressLabel(null)
    setNeedsRerecord(false)
    setSubmitError(null)
    transcriptRef.current = ''
    // 'answering' 전환은 notifyPresentationDone 이 한다 — 오디오가 있으면 재생이
    // 끝난 뒤, audioAvailable 이 false 면 기다릴 게 없어 바로 호출된다(컨테이너 쪽 책임).
    setPhase('presenting')
  }, [])

  /**
   * 질문 제시가 끝났다는 신호다 — 오디오가 있으면 재생 종료, 없으면(audioAvailable
   * false) 곧바로 컨테이너가 부른다. questionId 를 받아서, 이전 질문의 오디오가
   * 늦게 끝나 신호가 뒤늦게 와도 이미 다음 질문으로 넘어갔으면 무시한다.
   */
  const notifyPresentationDone = useCallback(
    (questionId: string) => {
      if (questionRef.current?.questionId !== questionId) return

      setRemainingSec(answerTimeLimitSec)
      answerStartRef.current = Date.now()
      setPhase('answering')
    },
    [answerTimeLimitSec],
  )

  const handleProgress = useCallback((progress: ProgressPush) => {
    setProgressLabel(PROGRESS_STAGE_LABEL[progress.stage])
  }, [])

  // 에러로 'answering' 에 돌아갈 때마다 쓴다. 재답변 · 재시도가 실제로 시작되는
  // 시점을 answerStartRef 기준으로 다시 잡아, durationSec 이 원래 답변 + 대기 시간까지
  // 포함해 부풀지 않게 한다.
  const returnToAnswering = useCallback(() => {
    answerStartRef.current = Date.now()
    setPhase('answering')
  }, [])

  const handleError = useCallback(
    (error: ErrorPush) => {
      if (error.needsRerecord) {
        setNeedsRerecord(true)
        setSubmitError(null)
        returnToAnswering()
        return
      }

      if (!error.retryable) {
        if (finishedRef.current) {
          // 세션이 이미 끝난 뒤 늦게 도착한 중복 제출 에러 — 조용히 무시한다.
          return
        }
        setSubmitError({ message: toUserMessage(error.errorCode), retryable: false })
        returnToAnswering()
        return
      }

      setSubmitError({ message: toUserMessage(error.errorCode), retryable: true })
      returnToAnswering()
    },
    [returnToAnswering],
  )

  const handleSessionEnd = useCallback((payload: SessionEndPush) => {
    finishedRef.current = true
    setSessionEnd(payload)
    setPhase('finished')
  }, [])

  useEffect(() => {
    const disconnect = connectSessionSocket(sessionId, {
      onQuestion: handleQuestion,
      onProgress: handleProgress,
      onError: handleError,
      onSessionEnd: handleSessionEnd,
    })

    return disconnect
  }, [sessionId, handleQuestion, handleProgress, handleError, handleSessionEnd])

  // 질문당 제한 시간 카운트다운. answerTimeLimitSec 이 null 이면 제한 없음이라 돌리지 않는다.
  useEffect(() => {
    if (phase !== 'answering' || answerTimeLimitSec === null) return

    const timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev === null || prev <= 0) {
          // 0에 도달한 뒤에도 계속 틱하지 않도록 스스로 멈춘다 — 남은 결정(무응답 타임아웃
          // 정책)이 나기 전까지 phase 가 'answering' 에 계속 머무를 수 있어서다.
          clearInterval(timer)
          return prev
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, answerTimeLimitSec, question?.questionId])

  const pendingDurationSecRef = useRef(0)

  const beginSubmit = useCallback(() => {
    if (phaseRef.current !== 'answering') return

    pendingDurationSecRef.current = Math.max(0, Math.round((Date.now() - answerStartRef.current) / 1000))
    setPhase('submitting')
    setSubmitError(null)
    setNeedsRerecord(false)
  }, [])

  const cancelSubmit = useCallback((message: string) => {
    if (finishedRef.current) return
    // returnToAnswering 과 마찬가지로 재답변이 실제로 시작되는 시점을 다시 잡는다 —
    // 안 그러면 durationSec 이 업로드 실패·재시도에 걸린 시간까지 포함해 부풀어 버린다.
    answerStartRef.current = Date.now()
    setPhase('answering')
    setSubmitError({ message, retryable: true })
  }, [])

  const submitAnswer = useCallback(
    (recording: AnswerRecordingKeys, isTimeout: boolean) => {
      const current = questionRef.current
      if (!current) return

      const submission: AnswerSubmission = {
        questionId: current.questionId,
        audioObjectKey: recording.audioObjectKey,
        videoObjectKey: recording.videoObjectKey,
        isTimeout,
        durationSec: pendingDurationSecRef.current,
        transcript: transcriptRef.current,
      }

      void (async () => {
        try {
          await submitAnswerRequest(sessionId, submission)
          // session_end 가 REST 응답보다 먼저 도착했을 수 있다 — 이미 끝났으면 되돌리지 않는다.
          if (!finishedRef.current) {
            setPhase('waitingNextQuestion')
          }
        } catch (error) {
          if (finishedRef.current) return
          setPhase('answering')
          const message = error instanceof ApiError ? toUserMessage(error.code) : '답변 제출에 실패했어요. 다시 시도해주세요.'
          setSubmitError({ message, retryable: true })
          console.error('답변 제출 실패 questionId=%s', submission.questionId)
        }
      })()
    },
    [sessionId],
  )

  // 무응답 타임아웃: 질문당 제한 시간이 다 됐는데 제출하지 않은 경우.
  useEffect(() => {
    if (phase !== 'answering' || answerTimeLimitSec === null || remainingSec !== 0) return

    if (transcriptRef.current.trim() === '') {
      // TODO(INT-8 미확정): 완전 무응답 상태로 시간이 끝난 경우 정책이 아직 없다
      // (일반적인 "답변 중 시간 끊김"과는 별개 케이스로, 지금 결정하지 않기로 함).
      // 자동 제출하지 않고 'answering' 에 머무른다 — 정책이 정해지면 이 분기를 고친다.
      //
      // 발생 조건: 현재 질문(questionRef.current?.questionId)의 answerTimeLimitSec 이
      // 다 될 때까지 사용자가 한마디도 답하지 않은 경우 — 질문마다 시간이 끊길 때마다
      // 반복되는 정상 흐름이라 에러 로그는 남기지 않는다.
      //
      // 지금 transcript 는 STT 미연동으로 항상 빈 문자열이라(useInterviewSession.ts
      // 상단 transcriptRef 선언부 TODO 참고) 이 함수의 아래쪽 분기(onAnswerTimeout 호출)는
      // 실제로는 아직 한 번도 타지 않는다 — STT 가 연동돼 이 분기가 실제로 실행되기
      // 시작하면, cancelSubmit 이 phase 를 'answering' 으로 되돌리는 게 remainingSec===0 인
      // 상태와 맞물려 같은 타임아웃 제출을 반복 시도하지 않는지 다시 봐야 한다(아직
      // 검증 못 함).
      return
    }

    const current = questionRef.current
    if (!current) return

    beginSubmit()
    onAnswerTimeout(current.questionId)
  }, [remainingSec, phase, answerTimeLimitSec, beginSubmit, onAnswerTimeout])

  return {
    phase,
    question,
    progressLabel,
    needsRerecord,
    submitError,
    isFinished: phase === 'finished',
    sessionEnd,
    remainingSec,
    beginSubmit,
    submitAnswer,
    cancelSubmit,
    notifyPresentationDone,
  }
}
