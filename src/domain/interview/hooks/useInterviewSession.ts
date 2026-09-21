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
  submitAnswer: () => void
  /** 질문 제시(텍스트/오디오)가 끝났을 때 컨테이너가 부른다 — presenting → answering 전환. */
  notifyPresentationDone: (questionId: string) => void
}

/**
 * 면접 세션 진행(이슈 #24, B-01-2) 상태 머신입니다.
 * WS push(question/progress/error/session_end)를 받아 phase 를 굴리고, 답변 제출은
 * REST(sessionApi.submitAnswer)로 보낸다. 경로 · 페이로드 변환은 api/ 에만 두고 여기서는
 * 이미 정규화된 도메인 타입만 다룬다.
 */
export function useInterviewSession(sessionId: string, answerTimeLimitSec: number | null): UseInterviewSessionResult {
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

  const performSubmit = useCallback(
    async (reason: AnswerSubmission['submissionReason']) => {
      const current = questionRef.current
      if (phaseRef.current !== 'answering' || !current) return

      setPhase('submitting')
      setSubmitError(null)
      setNeedsRerecord(false)

      const durationSec = Math.max(0, Math.round((Date.now() - answerStartRef.current) / 1000))

      const submission: AnswerSubmission = {
        questionId: current.questionId,
        durationSec,
        transcript: transcriptRef.current,
        submissionReason: reason,
      }

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
    },
    [sessionId],
  )

  const submitAnswer = useCallback(() => {
    void performSubmit('manual')
  }, [performSubmit])

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
      return
    }

    void performSubmit('timeout')
  }, [remainingSec, phase, answerTimeLimitSec, performSubmit])

  return {
    phase,
    question,
    progressLabel,
    needsRerecord,
    submitError,
    isFinished: phase === 'finished',
    sessionEnd,
    remainingSec,
    submitAnswer,
    notifyPresentationDone,
  }
}
