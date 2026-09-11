import { useCallback, useEffect, useRef, useState } from 'react'

import type { DeviceCheckState, DeviceFailureReason } from '../types/deviceCheck'

const UNCHECKED: DeviceCheckState = { status: 'unchecked', failureReason: null }

function getErrorName(error: unknown): string | undefined {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name
  }
  if (error instanceof Error) {
    return error.name
  }
  return undefined
}

const RESUME_TRIGGER_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * 크롬·사파리는 사용자 제스처 없이 만든 AudioContext 를 'suspended' 로 시작합니다.
 * 마운트 시 자동으로 점검을 시작하므로 제스처가 없을 수 있어, 다음 클릭·키 입력에
 * resume 을 걸어둡니다. 이미 실행 중이면 즉시 resume 만 시도하고 리스너는 달지 않습니다.
 */
function resumeOnNextUserGesture(audioContext: AudioContext): () => void {
  audioContext.resume().catch(() => {})

  if (audioContext.state !== 'suspended') {
    return () => {}
  }

  const handleGesture = () => {
    audioContext.resume().catch(() => {})
  }

  for (const eventName of RESUME_TRIGGER_EVENTS) {
    document.addEventListener(eventName, handleGesture)
  }

  return () => {
    for (const eventName of RESUME_TRIGGER_EVENTS) {
      document.removeEventListener(eventName, handleGesture)
    }
  }
}

function classifyFailure(error: unknown): DeviceFailureReason {
  const name = getErrorName(error)

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'permission-denied'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return 'not-found'
  }
  return 'unknown'
}

export type UseDeviceCheckResult = {
  camera: DeviceCheckState
  mic: DeviceCheckState
  videoStream: MediaStream | null
  /** 0(무음) ~ 1(최대) 범위로 정규화된 마이크 입력 레벨 */
  micLevel: number
  recheckCamera: () => void
  recheckMic: () => void
}

/**
 * 카메라·마이크 접근과 마이크 입력 레벨 측정을 전담합니다.
 * 화면은 이 훅이 주는 상태만 그리고, getUserMedia·AudioContext 는 여기서만 다룹니다.
 */
export function useDeviceCheck(): UseDeviceCheckResult {
  const [camera, setCamera] = useState<DeviceCheckState>(UNCHECKED)
  const [mic, setMic] = useState<DeviceCheckState>(UNCHECKED)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [micLevel, setMicLevel] = useState(0)

  const videoStreamRef = useRef<MediaStream | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const removeResumeListenersRef = useRef<(() => void) | null>(null)

  const stopCamera = useCallback(() => {
    videoStreamRef.current?.getTracks().forEach((track) => track.stop())
    videoStreamRef.current = null
    setVideoStream(null)
  }, [])

  const stopMic = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    removeResumeListenersRef.current?.()
    removeResumeListenersRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop())
    audioStreamRef.current = null
    setMicLevel(0)
  }, [])

  const startMicMeter = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    audioContextRef.current = audioContext
    removeResumeListenersRef.current = resumeOnNextUserGesture(audioContext)

    const buffer = new Uint8Array(analyser.fftSize)

    const tick = () => {
      analyser.getByteTimeDomainData(buffer)

      let sumSquares = 0
      for (let i = 0; i < buffer.length; i++) {
        const normalized = (buffer[i] - 128) / 128
        sumSquares += normalized * normalized
      }
      const rms = Math.sqrt(sumSquares / buffer.length)

      setMicLevel(Math.min(1, rms * 4))
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }, [])

  // 마운트 시엔 초기값이 이미 'unchecked' 이므로 리셋 없이 바로 요청만 보내는
  // acquire* 를 쓰고, 재점검(버튼 클릭)에서만 즉시 리셋합니다.
  // mountedRef 가드는 언마운트 이후(또는 재점검으로 낡아진) 응답이 뒤늦게 setState 하는 것을 막습니다.
  const acquireCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (mountedRef.current) {
        videoStreamRef.current = stream
        setVideoStream(stream)
        setCamera({ status: 'available', failureReason: null })
      } else {
        stream.getTracks().forEach((track) => track.stop())
      }
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (mountedRef.current) {
        setCamera({ status: 'failed', failureReason })
      }
      console.error('카메라 점검 실패 reason=%s', failureReason)
    }
  }, [])

  const acquireMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (mountedRef.current) {
        audioStreamRef.current = stream
        setMic({ status: 'available', failureReason: null })
        startMicMeter(stream)
      } else {
        stream.getTracks().forEach((track) => track.stop())
      }
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (mountedRef.current) {
        setMic({ status: 'failed', failureReason })
      }
      console.error('마이크 점검 실패 reason=%s', failureReason)
    }
  }, [startMicMeter])

  const recheckCamera = useCallback(() => {
    stopCamera()
    setCamera(UNCHECKED)
    acquireCamera()
  }, [stopCamera, acquireCamera])

  const recheckMic = useCallback(() => {
    stopMic()
    setMic(UNCHECKED)
    acquireMic()
  }, [stopMic, acquireMic])

  useEffect(() => {
    mountedRef.current = true

    void (async () => {
      await Promise.all([acquireCamera(), acquireMic()])
    })()

    return () => {
      mountedRef.current = false
      stopCamera()
      stopMic()
    }
  }, [acquireCamera, acquireMic, stopCamera, stopMic])

  return {
    camera,
    mic,
    videoStream,
    micLevel,
    recheckCamera,
    recheckMic,
  }
}
