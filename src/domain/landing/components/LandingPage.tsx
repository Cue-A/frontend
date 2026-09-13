import FeatureSection from './FeatureSection'
import HowItWorksSection from './HowItWorksSection'
import LandingFooter from './LandingFooter'
import LandingHero from './LandingHero'
import LandingNav from './LandingNav'
import PainPointSection from './PainPointSection'

/**
 * 랜딩 화면입니다. (A-01)
 *
 * 시안 순서대로 위에서 아래로 쌓습니다.
 * 상단바 → 히어로 → 이런 고민 → 핵심 기능 → 이용 방법 → 마지막 CTA → 푸터
 *
 * 로그인 전 화면이라 AppLayout 밖에서 그립니다. (router.tsx)
 * 색 · 타이포는 토큰이 dev 에 들어온 뒤에 한 번에 입힙니다.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav />

      <main className="flex-1">
        <LandingHero />
        <PainPointSection />
        <FeatureSection />
        <HowItWorksSection />
      </main>

      <LandingFooter />
    </div>
  )
}
