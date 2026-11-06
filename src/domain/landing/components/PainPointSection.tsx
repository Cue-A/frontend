import Card from '@/shared/ui/Card'

import { PAIN_POINTS } from '../lib/landingContent'

/**
 * "이런 고민, 있으셨나요?" 절입니다. (A-01)
 * 고민 한 줄 아래에 해결 한 줄을 붙여 짝으로 읽히게 합니다.
 *
 * 카드마다 고민 · 화살표 · 해결 세 줄을 **같은 줄 높이로 맞춥니다**(subgrid). 고민 문장이 두 줄인 카드만 화살표 · 해결 문장이
 * 아래로 밀려서, 옆 카드와 높이가 어긋나 보였습니다 (이슈 #187). 문장은 낱말 중간에서 끊기지 않게(`break-keep`), 마지막 줄에 한 낱말만 남지 않게(`text-pretty`) 줄바꿈합니다.
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

      {/*
        시안대로 4열입니다. 좁아지면 2열 → 1열로 내려갑니다.
        카드 하나가 세 줄(고민 · 화살표 · 해결)을 차지하고, 카드 안은 바깥 줄을 그대로 따라서(subgrid) 같은 줄의 카드끼리
        고민 칸 높이가 가장 긴 문장에 맞춰집니다.
      */}
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PAIN_POINTS.map((item) => (
          <li key={item.problem} className="row-span-3 grid grid-rows-subgrid">
            <Card padding="lg" className="row-span-3 grid grid-rows-subgrid gap-3">
              <p className="break-keep text-pretty text-body-md text-neutral-500">{item.problem}</p>

              <p aria-hidden className="text-center text-body-lg text-primary-400">
                ↓
              </p>

              <p className="break-keep text-pretty text-body-md font-semibold text-primary-700">{item.solution}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
