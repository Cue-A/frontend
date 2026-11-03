import { useEffect, useState } from 'react'

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
  start: () => void
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

/** 재시작해도 소용없는 에러 — 권한 거부·서비스 불가·네트워크 단절·미지원 언어. 이때는 조용히 자막만 포기한다. */
const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported'])

/** onend 직후 바로 start() 하면 실패가 빠르게 반복될 수 있어, 재시작 앞에 두는 짧은 지연. */
const RESTART_DELAY_MS = 300

export type UseLiveCaptionResult = {
  /** 이번 답변에서 지금까지 인식된 텍스트(확정 + 중간 결과). 아직 없으면 null. */
  caption: string | null
  /** 브라우저가 Web Speech API 를 지원하는지. false 면 자막 없이 면접만 진행된다. */
  isSupported: boolean
}

/**
 * 브라우저 내장 음성 인식(Web Speech API)으로 실시간 자막을 만든다. 화면 표시 전용이며
 * 서버로는 아무것도 보내지 않는다 — 평가용 STT 는 업로드된 녹음 파일로 서버가 따로 돌린다.
 *
 * `enabled` 가 true 인 동안만 인식하고, `resetKey`(질문 id)가 바뀌면 자막을 비운다.
 * Chrome 은 침묵이 이어지면 인식을 스스로 끝내(onend) 버려서, 아직 enabled 면 다시 시작한다.
 */
export function useLiveCaption(enabled: boolean, resetKey: string | null | undefined): UseLiveCaptionResult {
  const [caption, setCaption] = useState<string | null>(null)
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  const [prevEnabled, setPrevEnabled] = useState(enabled)
  const isSupported = getSpeechRecognition() !== null

  // 렌더 중 상태 보정(React 권장 패턴) — 질문이 바뀌거나, 같은 질문에서 답변을 다시 시작하면
  // (업로드 실패 후 재답변 등 질문 id 가 그대로인 경우) 이전 답변의 자막을 버린다.
  if (prevResetKey !== resetKey || (enabled && !prevEnabled)) {
    setCaption(null)
  }
  if (prevResetKey !== resetKey) setPrevResetKey(resetKey)
  if (prevEnabled !== enabled) setPrevEnabled(enabled)

  useEffect(() => {
    const Recognition = getSpeechRecognition()
    if (!enabled || !Recognition) return

    const recognition = new Recognition()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true

    // 인식이 재시작되면 results 가 처음부터 다시 쌓이므로, 재시작 전까지 확정된 문장은 따로 들고 간다.
    let committed = ''
    let shown = ''
    let active = true
    let restartTimer: ReturnType<typeof setTimeout> | undefined

    recognition.onresult = (event) => {
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
      if (FATAL_ERRORS.has(event.error)) active = false
    }

    recognition.onend = () => {
      if (!active) return
      // 재시작 후 results 가 비워지므로, 지금까지 보인 텍스트를 확정분으로 넘긴다.
      committed = shown ? `${shown} ` : ''
      restartTimer = setTimeout(() => {
        if (!active) return
        try {
          recognition.start()
        } catch {
          // 이미 시작된 상태 등 — 자막은 보조 기능이라 면접 진행을 막지 않는다.
          active = false
        }
      }, RESTART_DELAY_MS)
    }

    try {
      recognition.start()
    } catch {
      active = false
    }

    return () => {
      active = false
      clearTimeout(restartTimer)
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
      recognition.abort()
    }
  }, [enabled, resetKey])

  return { caption, isSupported }
}
