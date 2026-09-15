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
 *
 * 시안은 번호 원 오른쪽에 제목 · 부제를 붙이고, 칸 사이를 선으로 잇습니다.
 * 선은 원 높이(32px)의 가운데에 와야 해서 `mt-4` 를 줍니다.
 */
export default function StepIndicator({ current }: Props) {
  return (
    <nav aria-label="진행 단계">
      <ol className="flex items-start">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1
          const isCurrent = stepNumber === current
          const isLast = index === STEPS.length - 1

          return (
            <li
              key={step.title}
              aria-current={isCurrent ? 'step' : undefined}
              className={isLast ? 'flex shrink-0' : 'flex flex-1 items-start gap-4'}
            >
              <span className="flex shrink-0 items-start gap-3">
                <span
                  className={
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-body-md font-semibold tabular-nums ' +
                    (isCurrent
                      ? 'bg-primary-500 text-neutral-0'
                      : 'bg-neutral-200 text-neutral-400')
                  }
                >
                  {stepNumber}
                </span>

                <span className="flex flex-col">
                  <span
                    className={
                      'text-body-md font-semibold ' +
                      (isCurrent ? 'text-neutral-900' : 'text-neutral-400')
                    }
                  >
                    {step.title}
                  </span>
                  <span className="text-body-sm text-neutral-400">{step.subtitle}</span>
                </span>
              </span>

              {!isLast && <span aria-hidden className="mt-4 h-px flex-1 bg-neutral-200" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
