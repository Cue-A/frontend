import { DIFFERENCE, FEATURES } from '../lib/landingContent'

/**
 * "핵심 기능" 절과 "기존 서비스와 다른 점" 인용입니다. (A-01)
 * 두 절이 같은 이야기(왜 다른가)를 이어서 하기 때문에 한 컴포넌트에 뒀습니다.
 */
export default function FeatureSection() {
  return (
    <section id="features" aria-labelledby="features-title" className="flex flex-col gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 id="features-title">핵심 기능</h2>
        <p>{FEATURES.subtitle}</p>
      </div>

      {/* 시안대로 2열입니다. 좁아지면 1열로 내려갑니다 */}
      <ul className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        {FEATURES.items.map((item) => (
          <li key={item.title} className="flex flex-col gap-3 border p-6">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 border p-8 text-center">
        <h3>{DIFFERENCE.title}</h3>
        <p>{DIFFERENCE.body}</p>
      </div>
    </section>
  )
}
