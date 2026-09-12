import { PAIN_POINTS } from '../lib/landingContent'

/**
 * "이런 고민, 있으셨나요?" 절입니다. (A-01)
 * 고민 한 줄 아래에 해결 한 줄을 붙여 짝으로 읽히게 합니다.
 */
export default function PainPointSection() {
  return (
    <section aria-labelledby="pain-points" className="flex flex-col gap-8 px-6 py-16">
      <h2 id="pain-points" className="text-center">
        이런 고민, 있으셨나요?
      </h2>

      {/* 시안대로 4열입니다. 좁아지면 2열 → 1열로 내려갑니다 */}
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PAIN_POINTS.map((item) => (
          <li key={item.problem} className="flex flex-col gap-3 border p-5">
            <p>{item.problem}</p>
            <p aria-hidden="true">↓</p>
            <p>{item.solution}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
