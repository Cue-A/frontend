import { pickAvatarPreset } from '../lib/interviewerAvatars'
import type { InterviewerStyle, SessionPhase } from '../types/interview'
import InterviewerAvatar from './InterviewerAvatar'

type Props = {
  /** useAudioAmplitude 반환값. 0=idle, 1에 가까울수록 speaking 강도가 세다. 입이 벌어지는 정도로 쓴다. */
  speakingIntensity: number
  /** 아바타를 고르는 기준. 같은 세션은 새로고침해도 같은 얼굴이 나온다. */
  sessionId: string
  /** 답변 제출 후 대기(submitting · waitingNextQuestion) 동안 끄덕이는 모션을 켠다. */
  phase: SessionPhase
  /** 압박 면접관은 웃지 않는 입으로 그린다. */
  interviewerStyle: InterviewerStyle
}

const NODDING_PHASES: readonly SessionPhase[] = ['submitting', 'waitingNextQuestion']

/**
 * 면접관 아바타 영역.
 * w-80(320px): 바탕 원이 없고 viewBox 가 머리·어깨에 맞춰져 있어, 같은 폭이어도 이전(원 안 아바타)보다 얼굴이 크다.
 * 최소 지원 폭(min-w-5xl, InterviewSessionPage 참고)에서 우측 SessionSidePanel 과 겹치지 않는 선이다.
 */
export default function InterviewerAvatarStage({ speakingIntensity, sessionId, phase, interviewerStyle }: Props) {
  const preset = pickAvatarPreset(sessionId)

  return (
    <div className="mx-auto flex items-center justify-center">
      <div className="w-80">
        <InterviewerAvatar
          preset={preset}
          mouthOpen={speakingIntensity}
          isNodding={NODDING_PHASES.includes(phase)}
          isStern={interviewerStyle === 'pressure'}
        />
      </div>
    </div>
  )
}
