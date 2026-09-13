const STEPS = ['옵션설정', '장치 테스트', '면접 진행', '결과 확인']

type Props = {
  /** 1부터 셉니다 */
  current: number
}

/**
 * 옵션 설정 → 장치 테스트 → 면접 진행 → 결과 확인 4단계 표시입니다. (A-05 상단)
 * 지금 어디쯤 왔는지 알려주기만 하고, 눌러서 이동하지는 않습니다.
 *
 * 시안은 번호 원을 선으로 잇고 제목만 아래에 답니다. 선은 원 높이(32px)의
 * 가운데에 와야 해서 `mt-4` 를 줍니다.
 */
export default function StepIndicator({ current }: Props) {
  return (
    <nav aria-label="진행 단계">
      <ol className="flex items-start">
        {STEPS.map((title, index) => {
          const stepNumber = index + 1
          const isCurrent = stepNumber === current
          const isLast = index === STEPS.length - 1

          return (
            <li
              key={title}
              aria-current={isCurrent ? 'step' : undefined}
              className={isLast ? 'flex shrink-0' : 'flex flex-1 items-start gap-2 md:gap-4'}
            >
              <span className="flex w-16 shrink-0 flex-col items-center gap-2 md:w-24">
                <span
                  className={
                    'flex h-8 w-8 items-center justify-center rounded-full text-body-md font-semibold tabular-nums ' +
                    (isCurrent
                      ? 'bg-primary-500 text-neutral-0'
                      : 'bg-neutral-200 text-neutral-400')
                  }
                >
                  {stepNumber}
                </span>

                <span
                  className={
                    'text-body-sm ' +
                    (isCurrent ? 'font-semibold text-primary-600' : 'text-neutral-400')
                  }
                >
                  {title}
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
