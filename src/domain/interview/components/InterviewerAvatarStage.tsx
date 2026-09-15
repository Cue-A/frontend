type Props = {
  /** useAudioAmplitude 반환값. 0=idle, 1에 가까울수록 speaking 강도가 세다. */
  speakingIntensity: number
}

/** 점선 원 안의 아바타 자리표시자. 실제 아바타 렌더링은 이후 단계 몫이라 아이콘 + 안내문구만 그린다. */
export default function InterviewerAvatarStage({ speakingIntensity }: Props) {
  const intensity = Math.min(1, Math.max(0, speakingIntensity))

  return (
    // max-w-sm: 최소 지원 폭(min-w-5xl, InterviewSessionPage 참고)에서도 우측 SessionSidePanel과
    // 겹치지 않도록 계산해서 정한 상한이다. 더 키우면 좁은 화면에서 원이 사이드패널과 겹친다.
    <div className="mx-auto flex aspect-square w-full max-w-sm items-center justify-center">
      <div className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-primary-200">
        {/* speaking 강도만큼 진해지는 링. 계산값이라 인라인 style 사용 (docs/01-conventions.md 스타일 절) */}
        <div
          className="absolute inset-3 rounded-full border-4 border-primary-400"
          style={{ opacity: intensity * 0.6 }}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary-400"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
          </svg>
          <span className="text-body-md text-neutral-500">면접관 아바타 영역</span>
        </div>
      </div>
    </div>
  )
}
