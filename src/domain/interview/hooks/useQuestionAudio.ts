import { useEffect, useState } from 'react'

import { useAudioAmplitude } from './useAudioAmplitude'
import type { Question } from '../types/interview'

export type UseQuestionAudioResult = {
  /** <audio> 엘리먼트에 그대로 물릴 콜백 ref. */
  setAudioElement: (element: HTMLAudioElement | null) => void
  /** InterviewerAvatarStage 의 speaking 강도로 바로 쓸 수 있는 값(0~1). */
  amplitude: number
}

/**
 * 질문 음성 재생을 담당합니다. (이슈 #25)
 *
 * `audioAvailable` 이면 재생하고, 재생이 끝나면(또는 자동재생이 막히면)
 * `onPresentationDone` 을 불러 `useInterviewSession` 의 presenting → answering
 * 전환을 트리거한다. `audioAvailable` 이 false 면(TTS_FAILED 등) 재생 UI 자체를
 * 띄우지 않고 곧장 넘어간다 — 텍스트는 이미 QuestionText 가 그리고 있다.
 *
 * `audioElement.src = ...` 대신 `setAttribute` 를 쓰는 이유: React 19 컴파일러
 * eslint 규칙이 useState 에서 나온 값의 프로퍼티 대입을 금지한다(메서드 호출은 허용).
 */
export function useQuestionAudio(
  question: Question | null,
  onPresentationDone: (questionId: string) => void,
): UseQuestionAudioResult {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const amplitude = useAudioAmplitude(audioElement)

  useEffect(() => {
    if (!question) return

    if (!question.audioAvailable || !question.audioUrl) {
      onPresentationDone(question.questionId)
      return
    }

    if (!audioElement) return

    audioElement.setAttribute('src', question.audioUrl)

    audioElement.play().catch(() => {
      // 브라우저 자동재생 정책에 막혔을 수 있다. 들리지 않아도 텍스트로 진행할 수
      // 있으니(TTS_FAILED 와 같은 원칙, docs/01-conventions.md) 세션을 멈추지 않는다.
      onPresentationDone(question.questionId)
    })

    const handleEnded = () => onPresentationDone(question.questionId)
    audioElement.addEventListener('ended', handleEnded)

    return () => {
      audioElement.removeEventListener('ended', handleEnded)
    }
  }, [question, audioElement, onPresentationDone])

  return { setAudioElement, amplitude }
}
