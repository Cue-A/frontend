import {
  IconChartLine,
  IconDeviceImacQuestion,
  IconFileSearch,
  IconTimelineEvent,
} from '@tabler/icons-react'

import Card from '@/shared/ui/Card'

import { FEATURES, type FeatureTone } from '../lib/landingContent'

/**
 * 시안이 카드마다 지정한 아이콘입니다. 제목을 키로 씁니다.
 * (Figma `FeaturesDetailSection` 의 symbol 이름 그대로 Tabler 에서 골랐습니다)
 */
const ICONS: Record<string, typeof IconChartLine> = {
  실시간모의면접: IconDeviceImacQuestion,
  종합분석리포트: IconTimelineEvent,
  성장추적: IconChartLine,
  맞춤준비: IconFileSearch,
}

/** 아이콘 원의 배경. 시안의 네 색이 semantic 토큰과 같습니다. */
const TONE_CLASS: Record<FeatureTone, string> = {
  warning: 'bg-semantic-warning',
  success: 'bg-semantic-success',
  info: 'bg-semantic-info',
  danger: 'bg-semantic-danger',
}

function iconOf(title: string) {
  return ICONS[title.replace(/\s/g, '')]
}

/**
 * "핵심 기능" 절입니다. (A-01)
 *
 * 시안은 카드마다 색 있는 원형 아이콘이 붙습니다. 아이콘은 Tabler outline
 * 입니다 (docs/design-system.md §7).
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
        {FEATURES.items.map((item) => {
          const Icon = iconOf(item.title)

          return (
            <li key={item.title} className="flex">
              <Card padding="lg" className="flex flex-1 flex-col gap-4">
                {Icon && (
                  <span
                    aria-hidden
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-neutral-0 ${
                      TONE_CLASS[item.tone]
                    }`}
                  >
                    <Icon size={24} stroke={2} />
                  </span>
                )}

                <h3 className="text-h2 text-neutral-900">{item.title}</h3>
                <p className="text-body-md text-neutral-500">{item.description}</p>
              </Card>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
