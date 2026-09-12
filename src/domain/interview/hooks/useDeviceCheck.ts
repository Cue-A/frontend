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
  // 요청을 보낼 때마다 하나씩 늘려서, 응답이 왔을 때 "지금도 유효한 요청인지" 를 봅니다.
  // 카메라·마이크가 각각 따로 재점검되므로 카운터도 따로 둡니다 — 하나로 묶으면
  // 마이크만 재점검해도 카메라의 진행 중인 요청까지 낡은 것으로 취급됩니다.
  const cameraRequestIdRef = useRef(0)
  const micRequestIdRef = useRef(0)
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

    // 배경 잡음을 0으로 접어두고, 그 위 구간만 증폭해 평소 대화 음량에서도
    // 막대가 눈에 띄게 움직이도록 합니다.
    const NOISE_FLOOR = 0.01
    const GAIN = 6

    const tick = () => {
      analyser.getByteTimeDomainData(buffer)

      let sumSquares = 0
      for (let i = 0; i < buffer.length; i++) {
        const normalized = (buffer[i] - 128) / 128
        sumSquares += normalized * normalized
      }
      const rms = Math.sqrt(sumSquares / buffer.length)
      const level = rms <= NOISE_FLOOR ? 0 : Math.min(1, (rms - NOISE_FLOOR) * GAIN)

      setMicLevel(level)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }, [])

  // 마운트 시엔 초기값이 이미 'unchecked' 이므로 리셋 없이 바로 요청만 보내는
  // acquire* 를 쓰고, 재점검(버튼 클릭)에서만 즉시 리셋합니다.
  //
  // StrictMode 는 effect 를 두 번 돌립니다. 첫 번째 getUserMedia 요청이 (언마운트로)
  // 낡아진 뒤에도 두 번째 마운트 이후에 응답이 도착할 수 있는데, 예전엔 "마운트
  // 여부"만 봐서 이걸 그냥 통과시켰습니다. 그러면 낡은 스트림이 videoStreamRef 에
  // 들어갔다가 최신 스트림에 덮어써져서 stopCamera 가 그 트랙을 못 찾고, 카메라가
  // 꺼지지 않은 채 남았습니다. requestId 는 "이 응답이 지금 보낸 가장 최신 요청의
  // 응답인지" 를 보므로 재점검 중 빠르게 두 번 누른 경우의 경쟁 상태도 같이 막습니다.
  const acquireCamera = useCallback(async () => {
    const requestId = ++cameraRequestIdRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      if (requestId !== cameraRequestIdRef.current) {
        // 이 사이 재점검이 돌았거나 언마운트됐습니다. ref 에 넣지 말고 바로 반납합니다.
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      videoStreamRef.current = stream
      setVideoStream(stream)
      setCamera({ status: 'available', failureReason: null })
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (requestId === cameraRequestIdRef.current) {
        setCamera({ status: 'failed', failureReason })
      }
      console.error('카메라 점검 실패 reason=%s', failureReason)
    }
  }, [])

  const acquireMic = useCallback(async () => {
    const requestId = ++micRequestIdRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      if (requestId !== micRequestIdRef.current) {
        // startMicMeter 를 부르기 전에 걸러서, 낡은 요청을 위한 AudioContext 자체를
        // 만들지 않습니다. 트랙만 정리하면 되고 닫을 AudioContext 가 없습니다.
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      audioStreamRef.current = stream
      setMic({ status: 'available', failureReason: null })
      startMicMeter(stream)
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (requestId === micRequestIdRef.current) {
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
    void (async () => {
      await Promise.all([acquireCamera(), acquireMic()])
    })()

    return () => {
      // 아직 응답하지 않은 요청을 낡은 것으로 만듭니다. 언마운트 뒤에 응답이 와도
      // acquire* 안의 requestId 비교에서 걸러져 ref 에 들어가지 않습니다.
      cameraRequestIdRef.current += 1
      micRequestIdRef.current += 1
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
