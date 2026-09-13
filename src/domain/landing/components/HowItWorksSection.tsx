import { HOW_IT_WORKS } from '../lib/landingContent'

/**
 * "이용 방법" 다섯 단계입니다. (A-01)
 *
 * 시안은 단계마다 화면 스크린샷을 좌우로 번갈아 붙입니다. 이미지는 아직
 * 내보내지 않아서 자리만 잡아뒀습니다. 이미지가 준비되면 그 자리에 넣으면 됩니다.
 * 홀수 단계는 글이 왼쪽, 짝수 단계는 글이 오른쪽으로 갑니다.
 */
export default function HowItWorksSection() {
  return (
    <section aria-labelledby="how-it-works" className="flex flex-col gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 id="how-it-works">이용 방법</h2>
        <p>{HOW_IT_WORKS.subtitle}</p>
      </div>

      <ol className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        {HOW_IT_WORKS.steps.map((step, index) => (
          <li
            key={step.step}
            className={`flex flex-wrap items-center gap-8 ${
              index % 2 === 1 ? 'flex-row-reverse' : ''
            }`}
          >
            <div className="flex min-w-72 flex-1 flex-col gap-2">
              <span className="tabular-nums">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.lead}</p>
              <p>{step.description}</p>
            </div>

            <div
              aria-hidden="true"
              data-placeholder="Screenshot"
              className="flex min-w-72 flex-1 items-center justify-center border p-12"
            >
              화면 이미지 자리
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
