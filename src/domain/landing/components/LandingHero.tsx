import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { HERO, HIGHLIGHTS } from '../lib/landingContent'

/**
 * 첫 화면입니다. (A-01)
 *
 * "데모 영상 보기"는 아직 영상이 없어서 비활성입니다. 눌러도 아무 일이 없는
 * 것보다 왜 못 누르는지 보이는 편이 낫습니다. 영상이 준비되면 링크로 바꿉니다.
 *
 * 이유는 `title` 이 아니라 버튼 아래에 글로 적습니다. 브라우저는 비활성 요소에
 * 마우스 이벤트를 보내지 않아서 툴팁이 아예 안 뜹니다. (이슈 #32)
 */
export default function LandingHero() {
  return (
    <section className="flex flex-col items-center gap-8 px-6 py-20 text-center">
      <p className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-body-sm font-semibold text-primary-700">
        <span aria-hidden className="h-2 w-2 rounded-full bg-primary-500" />
        {HERO.badge}
      </p>

      <h1 className="flex flex-col gap-2 text-display text-neutral-900">
        {HERO.titleLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h1>

      <p className="max-w-2xl text-body-lg font-normal text-neutral-500">{HERO.description}</p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="primary" size="lg" to={ROUTES.SESSION_SETUP}>
          {HERO.primaryCta}
        </Button>

        <Button size="lg" disabled>
          {HERO.secondaryCta}
        </Button>
      </div>

      <p className="text-body-sm text-neutral-400">데모 영상은 아직 준비 중이에요</p>

      <ul className="flex w-full max-w-5xl flex-wrap justify-center gap-6 pt-8">
        {HIGHLIGHTS.map((item) => (
          <li key={item.title} className="flex min-w-64 flex-1">
            <Card padding="lg" className="flex flex-1 flex-col gap-1 text-left">
              <span className="text-body-lg font-semibold text-neutral-900">{item.title}</span>
              <span className="text-body-md text-neutral-500">{item.description}</span>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
