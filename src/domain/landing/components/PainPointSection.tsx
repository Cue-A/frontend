import Card from '@/shared/ui/Card'

import { PAIN_POINTS } from '../lib/landingContent'

/**
 * "이런 고민, 있으셨나요?" 절입니다. (A-01)
 * 고민 한 줄 아래에 해결 한 줄을 붙여 짝으로 읽히게 합니다.
 *
 * 배경은 단색이 아니라 모서리에 블롭이 깔린 워시입니다. `bg-wash` 한 클래스에
 * 들어 있습니다 (src/styles/tokens.css, docs/design-system.md §2.5).
 */
export default function PainPointSection() {
  return (
    <section
      aria-labelledby="pain-points"
      className="flex flex-col gap-10 bg-wash px-6 py-20 md:px-12"
    >
      <h2 id="pain-points" className="text-center text-h1 text-neutral-900">
        이런 고민, 있으셨나요?
      </h2>

      {/* 시안대로 4열입니다. 좁아지면 2열 → 1열로 내려갑니다 */}
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PAIN_POINTS.map((item) => (
          <li key={item.problem} className="flex">
            <Card padding="lg" className="flex flex-1 flex-col gap-3">
              <p className="text-body-md text-neutral-500">{item.problem}</p>

              <p aria-hidden className="text-center text-body-lg text-primary-400">
                ↓
              </p>

              <p className="text-body-md font-semibold text-primary-700">{item.solution}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
