import { Fragment } from 'react'

import Card from '@/shared/ui/Card'

import { PAIN_POINTS } from '../lib/landingContent'

/**
 * 토막마다 줄을 바꾸지 않는 칸(`inline-block`)으로 감싸서, 두 줄이 될 때는 토막 사이에서만 넘어가게 합니다.
 * 토막 사이 띄어쓰기는 그대로 둬서, 한 줄에 다 들어가면 원래 문장처럼 읽힙니다.
 */
function Phrases({ parts }: { parts: string[] }) {
  return parts.map((part, index) => (
    <Fragment key={part}>
      {index > 0 && ' '}
      <span className="inline-block">{part}</span>
    </Fragment>
  ))
}

/**
 * "이런 고민, 있으셨나요?" 절입니다. (A-01)
 * 고민 한 줄 아래에 해결 한 줄을 붙여 짝으로 읽히게 합니다.
 *
 * 카드마다 고민 · 화살표 · 해결 세 줄을 **같은 줄 높이로 맞춥니다**(subgrid). 고민 문장이 두 줄인 카드만 화살표 · 해결 문장이
 * 아래로 밀려서, 옆 카드와 높이가 어긋나 보였습니다 (이슈 #187). 화살표가 가운데라 고민 · 해결 문장도 가운데 정렬합니다.
 * 문장은 뜻이 끊기지 않는 자리에서만 줄을 바꿉니다 — 바꿔도 되는 자리는 `PAIN_POINTS` 에 토막으로 나눠 뒀습니다.
 * 토막 안에서도 낱말 중간에서는 끊기지 않게(`break-keep`) 둡니다.
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
          <li key={item.problem.join(' ')} className="row-span-3 grid grid-rows-subgrid">
            <Card padding="lg" className="row-span-3 grid grid-rows-subgrid gap-3 text-center">
              <p className="break-keep text-body-md text-neutral-500">
                <Phrases parts={item.problem} />
              </p>

              <p aria-hidden className="text-body-lg text-primary-400">
                ↓
              </p>

              <p className="break-keep text-body-md font-semibold text-primary-700">
                <Phrases parts={item.solution} />
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
