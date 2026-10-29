import { useEffect, useState } from 'react'

const RESUME_TRIGGER_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * 크롬·사파리는 사용자 제스처 없이 만든 AudioContext 를 'suspended' 로 시작한다.
 * 질문 오디오는 사용자 클릭 없이 자동 재생되므로 제스처가 없을 수 있어, 다음
 * 클릭·키 입력에 resume 을 걸어둔다. (useDeviceCheck.ts 의 마이크 레벨 미터와 같은 패턴)
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

const NOISE_FLOOR = 0.01
const GAIN = 6

/**
 * TTS 오디오 엘리먼트의 실시간 진폭(0~1)을 반환합니다.
 * InterviewerAvatarStage 의 speaking 강도 계산에 씁니다.
 *
 * audioElement 가 바뀔 때마다(질문이 바뀌어 다른 <audio> 를 물릴 일은 없지만, null↔엘리먼트
 * 전환에 대비해) AnalyserNode 를 새로 연결한다. 같은 <audio> 엘리먼트에 AudioContext 를
 * 두 번 연결할 수 없어서(InvalidStateError) 엘리먼트당 한 번만 연결되게 관리한다.
 */
export function useAudioAmplitude(audioElement: HTMLAudioElement | null): number {
  const [amplitude, setAmplitude] = useState(0)

  useEffect(() => {
    // audioElement 가 null 로 바뀌는 경우는 직전 값이 있었던 effect 의 cleanup 이
    // 이미 0으로 되돌려놨거나(아래 return 함수), 처음부터 0인 초기값 그대로다 —
    // 여기서 다시 setAmplitude 를 부를 필요가 없다(effect 본문에서 곧장 setState 하지
    // 않는다).
    if (!audioElement) return

    const audioContext = new AudioContext()
    const source = audioContext.createMediaElementSource(audioElement)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512

    // source -> analyser 로만 보내면 스피커로 소리가 안 나간다. analyser -> destination 도 이어야
    // 질문 음성이 실제로 들린다.
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    const removeResumeListeners = resumeOnNextUserGesture(audioContext)

    const buffer = new Uint8Array(analyser.fftSize)
    let animationFrame: number

    const tick = () => {
      analyser.getByteTimeDomainData(buffer)

      let sumSquares = 0
      for (let i = 0; i < buffer.length; i++) {
        const normalized = (buffer[i] - 128) / 128
        sumSquares += normalized * normalized
      }
      const rms = Math.sqrt(sumSquares / buffer.length)
      const level = rms <= NOISE_FLOOR ? 0 : Math.min(1, (rms - NOISE_FLOOR) * GAIN)

      setAmplitude(level)
      animationFrame = requestAnimationFrame(tick)
    }
    animationFrame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrame)
      removeResumeListeners()
      source.disconnect()
      analyser.disconnect()
      audioContext.close().catch(() => {})
      setAmplitude(0)
    }
  }, [audioElement])

  return amplitude
}
