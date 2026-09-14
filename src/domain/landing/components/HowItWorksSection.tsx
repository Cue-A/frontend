import { HOW_IT_WORKS } from '../lib/landingContent'

/**
 * 시안 상단의 흐름 표시입니다. 다섯 단계 설명을 읽기 전에 전체 그림을 먼저 보여줍니다.
 *
 * 옵션 설정 화면(A-05)의 `StepIndicator` 와 비슷하지만 같지는 않습니다.
 * 여기는 원 48px 에 라벨이 **아래**, A-05 는 원 32px 에 제목 · 부제가 **오른쪽**입니다.
 * 합치려면 변형이 필요해서 지금은 각자 둡니다. (이슈 #32 의 3번)
 */
const FLOW_STEPS = ['옵션 설정', '장치 테스트', '면접 진행', '결과 확인']

function FlowSteps() {
  return (
    <ol className="mx-auto flex w-full max-w-4xl items-start">
      {FLOW_STEPS.map((title, index) => {
        const isLast = index === FLOW_STEPS.length - 1

        return (
          <li
            key={title}
            className={isLast ? 'flex shrink-0' : 'flex flex-1 items-start gap-2 md:gap-4'}
          >
            <span className="flex w-16 shrink-0 flex-col items-center gap-3 md:w-20">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-body-lg font-semibold text-neutral-0 tabular-nums">
                {index + 1}
              </span>
              <span className="text-body-sm text-neutral-500">{title}</span>
            </span>

            {!isLast && <span aria-hidden className="mt-6 h-0.5 flex-1 bg-primary-200" />}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * "이용 방법" 다섯 단계입니다. (A-01)
 *
 * 시안은 단계마다 화면 스크린샷을 좌우로 번갈아 붙입니다. 이미지는 아직
 * 내보내지 않아서 자리만 잡아뒀습니다. 이미지가 준비되면 그 자리에 넣으면 됩니다.
 * 홀수 단계는 글이 왼쪽, 짝수 단계는 글이 오른쪽으로 갑니다.
 */
export default function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works"
      className="flex flex-col gap-12 bg-neutral-50 px-6 py-20 md:px-12"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 id="how-it-works" className="text-h1 text-neutral-900">
          이용 방법
        </h2>
        <p className="text-body-lg font-normal text-neutral-500">{HOW_IT_WORKS.subtitle}</p>
      </div>

      <FlowSteps />

      <ol className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        {HOW_IT_WORKS.steps.map((step, index) => (
          <li
            key={step.step}
            className={`flex flex-wrap items-center gap-10 ${
              index % 2 === 1 ? 'flex-row-reverse' : ''
            }`}
          >
            <div className="flex min-w-72 flex-1 flex-col gap-2">
              <span className="flex items-center gap-3 text-body-lg font-semibold text-primary-600 tabular-nums">
                {step.step}
                <span aria-hidden className="h-0.5 w-8 rounded-full bg-primary-200" />
              </span>

              <h3 className="text-h2 text-neutral-900">{step.title}</h3>
              <p className="text-body-lg font-normal text-neutral-700">{step.lead}</p>
              <p className="text-body-md text-neutral-500">{step.description}</p>
            </div>

            <div
              aria-hidden
              data-placeholder="Screenshot"
              className="flex min-w-72 flex-1 items-center justify-center rounded-lg bg-neutral-200 p-16 text-body-sm text-neutral-400"
            >
              화면 이미지 자리
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
