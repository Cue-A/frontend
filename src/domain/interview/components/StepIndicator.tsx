const STEPS = [
  { title: '옵션설정', subtitle: '직무 · 조건' },
  { title: '장치 테스트', subtitle: '마이크 · 카메라' },
  { title: '면접 진행', subtitle: '실전 응답' },
  { title: '결과 확인', subtitle: '리포트 · 피드백' },
]

type Props = {
  /** 1부터 셉니다 */
  current: number
}

/**
 * 옵션 설정 → 장치 테스트 → 면접 진행 → 결과 확인 4단계 표시입니다. (A-05 상단)
 * 지금 어디쯤 왔는지 알려주기만 하고, 눌러서 이동하지는 않습니다.
 */
export default function StepIndicator({ current }: Props) {
  return (
    <nav aria-label="진행 단계">
      <ol className="flex flex-wrap items-start gap-4">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1

          return (
            <li
              key={step.title}
              aria-current={stepNumber === current ? 'step' : undefined}
              className="flex min-w-40 flex-1 items-center gap-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border tabular-nums">
                {stepNumber}
              </span>

              <span className="flex min-w-0 flex-col">
                <span>{step.title}</span>
                <span>{step.subtitle}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
