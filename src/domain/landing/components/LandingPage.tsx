import DifferenceSection from './DifferenceSection'
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
 * 상단바 → 히어로 → 이런 고민 → 핵심 기능 → 이용 방법 → 기존 서비스와 다른 점
 * → 마지막 CTA → 푸터
 *
 * "기존 서비스와 다른 점"은 원래 핵심 기능 바로 뒤에 붙어 있었는데, 시안에서는
 * 이용 방법 다음입니다. 다섯 단계를 다 읽은 뒤에 "그래서 뭐가 다른가"로 받는
 * 자리라 순서를 시안에 맞췄습니다.
 *
 * 로그인 전 화면이라 AppLayout 밖에서 그립니다. (router.tsx)
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-0">
      <LandingNav />

      <main className="flex-1">
        <LandingHero />
        <PainPointSection />
        <FeatureSection />
        <HowItWorksSection />
        <DifferenceSection />
      </main>

      <LandingFooter />
    </div>
  )
}
