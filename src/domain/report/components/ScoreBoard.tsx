import type { ScoreBreakdown } from '../types/report'

type Props = {
  scores: ScoreBreakdown
}

const LABELS: { key: keyof Omit<ScoreBreakdown, 'total'>; label: string }[] = [
  { key: 'content', label: '내용' },
  { key: 'speech', label: '말하기' },
  { key: 'vision', label: '시선·표정' },
]

/**
 * 항목별 점수입니다.
 * 게이지는 아직 없어서 숫자와 막대로만 그립니다. 막대 너비는 계산값이라
 * 인라인 style 을 씁니다. (docs/01-conventions.md "스타일" 절)
 *
 * `border` 와 `bg-current` 는 토큰이 dev 에 들어오기 전까지 쓰는 임시값입니다.
 * 특정 색을 박은 게 아니라 글자색을 따라가게 둔 것이라, 토큰이 오면
 * 색 클래스만 갈아끼우면 됩니다.
 */
export default function ScoreBoard({ scores }: Props) {
  return (
    <section aria-label="항목별 점수" className="flex flex-col gap-4">
      <h2>항목별 점수</h2>

      <ul className="flex flex-col gap-3">
        {LABELS.map(({ key, label }) => (
          <li key={key} className="flex items-center gap-4">
            <span className="w-20 shrink-0">{label}</span>

            <div className="h-2 min-w-0 flex-1 border">
              <div className="h-full bg-current" style={{ width: `${scores[key]}%` }} />
            </div>

            <span className="w-10 shrink-0 text-right tabular-nums">{scores[key]}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
