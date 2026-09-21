import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { MediaTrackFailureReason, MediaTrackState } from '../types/media'

const UNCHECKED: MediaTrackState = { status: 'unchecked', failureReason: null }

function getErrorName(error: unknown): string | undefined {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name
  }
  if (error instanceof Error) {
    return error.name
  }
  return undefined
}

function classifyFailure(error: unknown): MediaTrackFailureReason {
  const name = getErrorName(error)

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'permission-denied'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return 'not-found'
  }
  return 'unknown'
}

export type UseMediaStreamResult = {
  camera: MediaTrackState
  mic: MediaTrackState
  /** SelfCameraPreview 의 <video> 에 그대로 물릴 스트림. camera 가 available 이 아니면 null. */
  videoStream: MediaStream | null
  /**
   * MediaRecorder 용으로 카메라·마이크 트랙을 합쳐 하나의 스트림으로 낸다.
   * 부분 실패를 허용하므로 둘 중 하나만 있어도(비디오만/오디오만) 값이 있고,
   * 둘 다 없으면 null — 그때는 녹화할 게 없다.
   */
  recordingStream: MediaStream | null
}

/**
 * 면접 진행 화면(B-01-3)의 카메라·마이크 스트림을 담당합니다.
 *
 * 장치 테스트 화면(`useDeviceCheck`)과 구조는 비슷하지만 별개 훅입니다 — 그 화면의
 * 스트림은 라우트를 벗어나며 이미 정리됐어서 재사용할 수 없고, 이 화면은 세션 내내
 * 살아있어야 해서 점검 통과 후에도 트랙이 끊기는 경우("device-ended")를 추가로 본다.
 *
 * 카메라·마이크를 따로 `getUserMedia` 하는 이유는 부분 실패를 허용하기 위해서다.
 * 한 번에 `{video, audio}` 로 요청하면 브라우저가 하나만 거부해도 전체가 reject 되는
 * 경우가 있다 — 카메라만 막혀도 마이크는 쓸 수 있어야 세션이 안 끊긴다.
 *
 * `initialDeviceStatus` 는 장치 테스트 화면(INT-4)의 점검 결과를 시작 값으로 받는다.
 * 점검 통과 여부만 미리 알려줘서 'unchecked' 로 잠깐 깜빡이는 걸 줄이는 용도이고,
 * 스트림 자체는(장치 테스트 화면 것을 재사용할 수 없어서) 여기서 새로 받는다.
 */
export function useMediaStream(initialDeviceStatus?: { camera: MediaTrackState; mic: MediaTrackState }): UseMediaStreamResult {
  const [camera, setCamera] = useState<MediaTrackState>(initialDeviceStatus?.camera ?? UNCHECKED)
  const [mic, setMic] = useState<MediaTrackState>(initialDeviceStatus?.mic ?? UNCHECKED)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  const videoStreamRef = useRef<MediaStream | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  // StrictMode 가 effect 를 두 번 돌린다. 낡은 요청의 응답이 나중에 와도 이 카운터로
  // "지금도 유효한 요청인지" 를 봐서, 낡은 스트림이 ref 에 들어갔다가 못 꺼지는 걸 막는다.
  const cameraRequestIdRef = useRef(0)
  const micRequestIdRef = useRef(0)

  const stopCamera = useCallback(() => {
    videoStreamRef.current?.getTracks().forEach((track) => track.stop())
    videoStreamRef.current = null
    setVideoStream(null)
  }, [])

  const stopMic = useCallback(() => {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop())
    audioStreamRef.current = null
    setAudioStream(null)
  }, [])

  const acquireCamera = useCallback(async () => {
    const requestId = ++cameraRequestIdRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      if (requestId !== cameraRequestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const [track] = stream.getVideoTracks()
      track.addEventListener('ended', () => {
        // 진행 중 장치가 뽑히거나 권한이 취소된 경우. 세션은 막지 않고 상태만 바꾼다.
        setCamera({ status: 'failed', failureReason: 'device-ended' })
        stopCamera()
      })

      videoStreamRef.current = stream
      setVideoStream(stream)
      setCamera({ status: 'available', failureReason: null })
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (requestId === cameraRequestIdRef.current) {
        setCamera({ status: 'failed', failureReason })
      }
      console.error('카메라 스트림 연결 실패 reason=%s', failureReason)
    }
  }, [stopCamera])

  const acquireMic = useCallback(async () => {
    const requestId = ++micRequestIdRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      if (requestId !== micRequestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const [track] = stream.getAudioTracks()
      track.addEventListener('ended', () => {
        setMic({ status: 'failed', failureReason: 'device-ended' })
        stopMic()
      })

      audioStreamRef.current = stream
      setAudioStream(stream)
      setMic({ status: 'available', failureReason: null })
    } catch (error) {
      const failureReason = classifyFailure(error)
      if (requestId === micRequestIdRef.current) {
        setMic({ status: 'failed', failureReason })
      }
      console.error('마이크 스트림 연결 실패 reason=%s', failureReason)
    }
  }, [stopMic])

  useEffect(() => {
    void (async () => {
      await Promise.all([acquireCamera(), acquireMic()])
    })()

    return () => {
      cameraRequestIdRef.current += 1
      micRequestIdRef.current += 1
      stopCamera()
      stopMic()
    }
    // 마운트 시 한 번만 받는다. initialDeviceStatus 는 첫 렌더의 시작값으로만 쓴다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // videoStream/audioStream 이 실제로 바뀔 때만 새로 만든다 — 매 렌더 새 MediaStream
  // 인스턴스를 주면 이걸 구독하는 쪽(useAnswerRecording)이 매번 재구독하게 된다.
  const recordingStream = useMemo(() => {
    const tracks = [...(videoStream?.getVideoTracks() ?? []), ...(audioStream?.getAudioTracks() ?? [])]
    return tracks.length > 0 ? new MediaStream(tracks) : null
  }, [videoStream, audioStream])

  return {
    camera,
    mic,
    videoStream,
    recordingStream,
  }
}
