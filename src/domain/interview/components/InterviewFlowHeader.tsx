import { INTERVIEW_STEPS } from '../lib/interviewSteps'

import StepIndicator from './StepIndicator'

type Props = {
  /** 지금 단계. 1부터 셉니다 */
  current: number
}

/**
 * 면접 흐름 화면의 머리입니다 — 경로 표시("모의면접 / 장치 테스트") · STEP 라벨 · 단계 표시.
 *
 * 장치 테스트(시안 반영, 이슈 #81)에 먼저 생긴 모양을 옵션 설정에도 그대로 쓰려고 꺼냈습니다. 이슈 #81 에
 * "옵션 설정 · 장치 테스트 · 면접 진행 화면의 헤더 문구 위치는 서로 통일" 로 정해져 있는데, 화면마다 따로 적어 두니
 * 옵션 설정에는 경로 표시와 STEP 라벨이 빠져 있었습니다. 한 곳에서 그려서 다시 어긋나지 않게 합니다.
 */
export default function InterviewFlowHeader({ current }: Props) {
  const step = INTERVIEW_STEPS[current - 1]

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-neutral-500">
        모의면접<span className="font-semibold text-neutral-900"> / {step?.title}</span>
      </p>

      {/* STEP 라벨과 Stepper 는 한 묶음이라 Figma 원본 간격(10px)을 그대로 유지한다. */}
      <div className="flex flex-col gap-2.5">
        <span className="text-body-sm font-bold text-primary-500">{`STEP ${current}/${INTERVIEW_STEPS.length}`}</span>
        <StepIndicator current={current} />
      </div>
    </div>
  )
}
