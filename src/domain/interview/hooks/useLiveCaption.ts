import { useEffect, useState } from 'react'

import type { CaptionFailureReason } from '../types/media'

/**
 * Web Speech API 는 TypeScript 기본 lib.dom 에 타입이 없어서, 이 훅이 쓰는 부분만
 * 직접 선언한다 (docs/01-conventions.md "any 를 쓰지 않습니다").
 */
type SpeechRecognitionAlternativeLike = { transcript: string }
type SpeechRecognitionResultLike = {
  readonly length: number
  readonly isFinal: boolean
  [index: number]: SpeechRecognitionAlternativeLike
}
type SpeechRecognitionResultListLike = { readonly length: number; [index: number]: SpeechRecognitionResultLike }
type SpeechRecognitionEventLike = { results: SpeechRecognitionResultListLike }

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  /** `track` 인자는 Chrome 133+ 에서만 의미가 있다. 낡은 브라우저는 인자를 조용히 무시한다. */
  start: (track?: MediaStreamTrack) => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

let trackStartSupport: boolean | undefined

/**
 * `recognition.start(track)` 을 브라우저가 지원하는지. 이 오버로드는 기능 감지용 API 가 없어서(스펙 논의
 * web-speech-api#126 에서 "나중에 isSourceSupported 를 추가할 수 있다" 로 종결) 알려진 우회로 확인한다:
 * 일부러 잘못된 인자(0)로 start() 를 불러, 지원하는 브라우저는 TypeError 를 던지고 낡은 브라우저는 인자를
 * 무시하고 그냥 시작한다. 마이크 권한 프롬프트가 뜨지 않도록 분리(detached)된 iframe 의 인식기로 시험한다.
 * 이름이 TypeError 인지로 판정하는 휴리스틱이라 Chrome 이 검증 방식을 바꾸면 틀릴 수 있다. 결과는 캐시한다.
 */
function supportsTrackStart(): boolean {
  if (trackStartSupport !== undefined) return trackStartSupport
  trackStartSupport = false
  if (typeof document === 'undefined' || !document.body) {
    trackStartSupport = undefined // body 가 아직 없다 — 결과를 캐시하지 않고 다음에 다시 시도한다.
    return false
  }

  const frame = document.body.appendChild(document.createElement('iframe'))
  try {
    const frameWindow = frame.contentWindow as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    } | null
    const Recognition = frameWindow?.SpeechRecognition ?? frameWindow?.webkitSpeechRecognition
    if (!Recognition) return false
    const recognition = new Recognition()
    frame.remove() // start() 전에 분리해야 낡은 브라우저에서도 실제로 시작되지 않는다.
    try {
      recognition.start(0 as unknown as MediaStreamTrack)
      recognition.stop()
      trackStartSupport = false
    } catch (error) {
      // iframe 의 realm 에서 던진 에러라 `error instanceof Error` 는 항상 false 다(다른 window 의 Error). 이름으로 판정한다.
      trackStartSupport = (error as { name?: unknown } | null)?.name === 'TypeError'
    }
  } catch {
    trackStartSupport = false
  } finally {
    frame.remove()
  }
  return trackStartSupport
}

/**
 * 재시작해도 소용없는 에러 — 권한 거부·서비스 불가·네트워크 단절·미지원 언어. 이때는 이번 답변의 자막을 포기하고
 * 자막 칸에 이유를 보여준다(이슈 #215). 다음 답변에서는 다시 시도한다(네트워크는 금방 돌아올 수 있다).
 */
const FATAL_ERRORS: Record<string, CaptionFailureReason> = {
  network: 'network',
  'not-allowed': 'permission',
  'service-not-allowed': 'permission',
  'audio-capture': 'audio-capture',
  'language-not-supported': 'unsupported',
}

/** 인식 중에 늘 나는 에러 — 침묵(no-speech) · 우리가 멈춤(aborted). 실패로 보지 않고 재시작에 맡긴다. */
const BENIGN_ERRORS = new Set(['no-speech', 'aborted'])

/**
 * 고른 마이크 트랙으로 인식을 시작한 뒤 이 시간 안에 결과가 하나도 없으면 기본 마이크로 바꾼다(이슈 #215).
 * `start(track)` 은 오류 없이 결과만 안 오는 식으로 실패할 수 있어서, 오류만 기준으로 하면 그 경우를 못 잡는다.
 * 답변 첫 10초를 말없이 보내면 트랙이 멀쩡해도 바뀌지만, 기본 마이크로도 자막은 나와서 손해가 작다.
 */
const SELECTED_MIC_RESULT_TIMEOUT_MS = 10_000

/** onend 직후 바로 start() 하면 실패가 빠르게 반복될 수 있어, 재시작 앞에 두는 짧은 지연. */
const RESTART_DELAY_MS = 300

export type UseLiveCaptionResult = {
  /** 이번 답변에서 지금까지 인식된 텍스트(확정 + 중간 결과). 아직 없으면 null. */
  caption: string | null
  /** 브라우저가 Web Speech API 를 지원하는지. false 면 자막 없이 면접만 진행된다. */
  isSupported: boolean
  /**
   * 넘겨준 마이크 트랙이 자막 인식에 실제로 쓰이는지. 트랙을 넘겼는데 false 면 브라우저가 `start(track)` 을
   * 지원하지 않거나, 그 트랙으로 인식이 안 돼 기본 마이크로 바꾼 것이다(이슈 #215). 시스템 기본 마이크로 인식하는 중이라
   * 선택한 마이크와 다를 수 있다. 트랙이 없으면 true(비교 대상 없음).
   */
  usesSelectedMic: boolean
  /** 이번 답변에서 자막을 만들 수 없게 된 이유. 문제없거나 아직 모르면 null. 다음 답변을 시작하면 비운다. */
  failure: CaptionFailureReason | null
}

/**
 * 브라우저 내장 음성 인식(Web Speech API)으로 실시간 자막을 만든다. 화면 표시 전용이며
 * 서버로는 아무것도 보내지 않는다 — 평가용 STT 는 업로드된 녹음 파일로 서버가 따로 돌린다.
 *
 * `enabled` 가 true 인 동안만 인식하고, `resetKey`(질문 id)가 바뀌면 자막을 비운다.
 * Chrome 은 침묵이 이어지면 인식을 스스로 끝내(onend) 버려서, 아직 enabled 면 다시 시작한다.
 *
 * `micTrack`(장치 테스트에서 고른 마이크의 오디오 트랙, 이슈 #169)을 주고 브라우저가 `start(track)` 을
 * 지원하면 그 트랙으로 인식한다. 지원하지 않으면 지금까지처럼 시스템 기본 마이크로 인식한다(`usesSelectedMic` false).
 * 트랙이 바뀌거나(끊김 포함) 사라지면 인식을 새 트랙으로 다시 시작한다. 녹음과 같은 트랙을 읽기만 하며 멈추지 않는다.
 *
 * 고른 마이크로 인식하다가 오류가 나거나 10초 동안 결과가 없으면, 그 세션 동안은 기본 마이크로 인식한다(이슈 #215).
 * 기본 마이크로도 실패하면(`FATAL_ERRORS`) `failure` 로 이유를 알려준다. 원인은 콘솔에도 남긴다.
 */
export function useLiveCaption(
  enabled: boolean,
  resetKey: string | null | undefined,
  micTrack: MediaStreamTrack | null = null,
): UseLiveCaptionResult {
  const [caption, setCaption] = useState<string | null>(null)
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  const [prevEnabled, setPrevEnabled] = useState(enabled)
  const [failure, setFailure] = useState<CaptionFailureReason | null>(null)
  // 고른 마이크 트랙으로 인식이 안 돼서 기본 마이크로 바꿨는지. 한 번 바꾸면 이 화면(세션)이 끝날 때까지 유지한다.
  const [fellBackToDefaultMic, setFellBackToDefaultMic] = useState(false)
  const isSupported = getSpeechRecognition() !== null
  // 기능 감지는 마운트 때 한 번만 한다(결과는 모듈에도 캐시된다). 렌더마다 부르지 않는다.
  const [trackStartSupported] = useState(() => isSupported && supportsTrackStart())
  const useSelectedMicTrack = trackStartSupported && !fellBackToDefaultMic
  const usesSelectedMic = micTrack === null || useSelectedMicTrack

  // 렌더 중 상태 보정(React 권장 패턴) — 질문이 바뀌거나, 같은 질문에서 답변을 다시 시작하면
  // (업로드 실패 후 재답변 등 질문 id 가 그대로인 경우) 이전 답변의 자막과 실패 이유를 버린다.
  if (prevResetKey !== resetKey || (enabled && !prevEnabled)) {
    setCaption(null)
    setFailure(null)
  }
  if (prevResetKey !== resetKey) setPrevResetKey(resetKey)
  if (prevEnabled !== enabled) setPrevEnabled(enabled)

  useEffect(() => {
    const Recognition = getSpeechRecognition()
    if (!enabled || !Recognition) return

    const recognition = new Recognition()
    const selectedTrack = useSelectedMicTrack ? micTrack : null
    const viaSelectedMic = selectedTrack !== null
    const startRecognition = () => (selectedTrack ? recognition.start(selectedTrack) : recognition.start())
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true

    // 인식이 재시작되면 results 가 처음부터 다시 쌓이므로, 재시작 전까지 확정된 문장은 따로 들고 간다.
    let committed = ''
    let shown = ''
    let active = true
    let restartTimer: ReturnType<typeof setTimeout> | undefined
    let failTimer: ReturnType<typeof setTimeout> | undefined
    let resultTimer: ReturnType<typeof setTimeout> | undefined

    /**
     * 이번 인식을 접는다. 고른 마이크로 인식하던 중이면 기본 마이크로 바꾸고(상태가 바뀌어 effect 가 기본 마이크로 다시 돈다),
     * 이미 기본 마이크면 자막 칸에 이유를 보여준다. 원인은 콘솔에 남긴다(자막은 서버로 안 가서 콘솔이 유일한 단서다).
     */
    const giveUp = (cause: string, reason: CaptionFailureReason) => {
      if (!active) return
      active = false
      clearTimeout(restartTimer)
      clearTimeout(resultTimer)
      if (viaSelectedMic) {
        console.warn('실시간 자막: 고른 마이크로 인식이 안 돼 기본 마이크로 바꿉니다 cause=%s', cause)
        setFellBackToDefaultMic(true)
        return
      }
      console.warn('실시간 자막을 만들 수 없습니다 cause=%s reason=%s', cause, reason)
      setFailure(reason)
    }

    if (viaSelectedMic) {
      resultTimer = setTimeout(() => giveUp('no-result-timeout', 'unsupported'), SELECTED_MIC_RESULT_TIMEOUT_MS)
    }

    recognition.onresult = (event) => {
      clearTimeout(resultTimer)
      let interim = ''
      let finalized = ''
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) finalized += text
        else interim += text
      }
      shown = `${committed}${finalized}${interim}`.trim()
      setCaption(shown === '' ? null : shown)
    }

    recognition.onerror = (event) => {
      const reason = FATAL_ERRORS[event.error]
      if (reason) {
        giveUp(event.error, reason)
        return
      }
      // 고른 마이크 트랙 경로에서 난 그 밖의 오류도 트랙 문제일 수 있어 기본 마이크로 바꾼다.
      if (viaSelectedMic && !BENIGN_ERRORS.has(event.error)) giveUp(event.error, 'unsupported')
    }

    recognition.onend = () => {
      if (!active) return
      // 재시작 후 results 가 비워지므로, 지금까지 보인 텍스트를 확정분으로 넘긴다.
      committed = shown ? `${shown} ` : ''
      restartTimer = setTimeout(() => {
        if (!active) return
        try {
          startRecognition()
        } catch (error) {
          // 트랙이 끊긴 상태(InvalidStateError) 등 — 자막은 보조 기능이라 면접 진행을 막지 않는다.
          giveUp(`restart:${(error as { name?: string } | null)?.name ?? 'unknown'}`, 'unsupported')
        }
      }, RESTART_DELAY_MS)
    }

    try {
      startRecognition()
    } catch (error) {
      // effect 본문에서 바로 상태를 바꾸지 않도록(react-hooks/set-state-in-effect) 다음 틱으로 미룬다.
      const cause = `start:${(error as { name?: string } | null)?.name ?? 'unknown'}`
      failTimer = setTimeout(() => giveUp(cause, 'unsupported'), 0)
    }

    return () => {
      active = false
      clearTimeout(restartTimer)
      clearTimeout(failTimer)
      clearTimeout(resultTimer)
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
      recognition.abort()
    }
  }, [enabled, resetKey, micTrack, useSelectedMicTrack])

  return { caption, isSupported, usesSelectedMic, failure }
}
