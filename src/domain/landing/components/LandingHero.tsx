import { ROUTES } from '@/app/routes'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { HERO, HIGHLIGHTS } from '../lib/landingContent'

/**
 * 첫 화면입니다. (A-01)
 *
 * 시안에는 "데모 영상 보기" 버튼이 있었지만 데모 영상은 만들지 않기로 해서 뺐습니다.
 * 버튼은 "지금 면접 연습 시작" 하나입니다. (이슈 #160)
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
      </div>

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
