import Card from '@/shared/ui/Card'

import { DIFFERENCE } from '../lib/landingContent'

/**
 * "기존 서비스와 다른 점" 인용입니다. (A-01)
 *
 * 시안에서 이 구역은 이용 방법 **다음**, 마지막 CTA **앞**에 옵니다.
 * 다섯 단계를 다 읽은 뒤에 "그래서 뭐가 다른가"로 받는 자리입니다.
 * 원래는 핵심 기능 바로 뒤에 붙어 있었는데 시안 순서대로 옮겼습니다.
 */
export default function DifferenceSection() {
  return (
    <section aria-labelledby="difference" className="bg-neutral-50 px-6 py-20 md:px-12">
      <Card padding="lg" className="mx-auto flex w-full max-w-5xl flex-col gap-4 text-center">
        <h2 id="difference" className="text-body-lg font-semibold text-primary-600">
          {DIFFERENCE.title}
        </h2>

        <p className="text-h2 leading-relaxed text-neutral-900">{DIFFERENCE.body}</p>
      </Card>
    </section>
  )
}
