import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/routes'

import { HERO, HIGHLIGHTS } from '../lib/landingContent'

/**
 * 첫 화면입니다. (A-01)
 *
 * "데모 영상 보기"는 아직 영상이 없어서 비활성입니다. 눌러도 아무 일이 없는
 * 것보다 왜 못 누르는지 보이는 편이 낫습니다. 영상이 준비되면 링크로 바꿉니다.
 */
export default function LandingHero() {
  return (
    <section className="flex flex-col items-center gap-8 px-6 py-20 text-center">
      <p className="border px-4 py-1">{HERO.badge}</p>

      <h1 className="flex flex-col gap-1">
        {HERO.titleLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h1>

      <p className="max-w-2xl">{HERO.description}</p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link to={ROUTES.SESSION_SETUP} className="border px-6 py-3">
          {HERO.primaryCta}
        </Link>

        <button type="button" disabled title="데모 영상은 준비 중이에요" className="border px-6 py-3">
          {HERO.secondaryCta}
        </button>
      </div>

      <ul className="flex w-full max-w-4xl flex-wrap justify-center gap-4">
        {HIGHLIGHTS.map((item) => (
          <li key={item.title} className="flex min-w-64 flex-1 flex-col gap-1 border p-5">
            <span>{item.title}</span>
            <span>{item.description}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
