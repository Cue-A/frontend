import Card from '@/shared/ui/Card'

import { FEATURES } from '../lib/landingContent'

/**
 * "핵심 기능" 절입니다. (A-01)
 *
 * 시안은 카드마다 색 있는 원형 아이콘이 붙습니다. 아이콘 라이브러리가
 * 아직 dev 에 없어서 이번에는 글만 넣었습니다. (이슈 #32 참고)
 */
export default function FeatureSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="flex flex-col gap-10 bg-neutral-0 px-6 py-20 md:px-12"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 id="features-title" className="text-h1 text-neutral-900">
          핵심 기능
        </h2>
        <p className="text-body-lg font-normal text-neutral-500">{FEATURES.subtitle}</p>
      </div>

      {/* 시안대로 2열입니다. 좁아지면 1열로 내려갑니다 */}
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
        {FEATURES.items.map((item) => (
          <li key={item.title} className="flex">
            <Card padding="lg" className="flex flex-1 flex-col gap-3">
              <h3 className="text-h2 text-neutral-900">{item.title}</h3>
              <p className="text-body-md text-neutral-500">{item.description}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
