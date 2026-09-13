import { useEffect, useState } from 'react'

/**
 * TTS 오디오 엘리먼트의 실시간 진폭(0~1)을 반환합니다.
 * InterviewerAvatarStage 의 speaking 강도 계산에 씁니다.
 *
 * 지금은 인터페이스만 정의합니다. AnalyserNode 연결(실제 오디오 재생)은 B-03 에서 합니다.
 */
export function useAudioAmplitude(audioElement: HTMLAudioElement | null): number {
  const [amplitude] = useState(0)

  useEffect(() => {
    // TODO(B-03): audioElement 로 AudioContext/AnalyserNode 연결해 진폭 계산
  }, [audioElement])

  return amplitude
}
