import type { TurnReport } from '../types/report'

type Props = {
  turn: TurnReport
}

function formatSeconds(seconds: number) {
  const total = Math.floor(seconds)
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

/**
 * 질문 하나에 대한 결과입니다.
 *
 * 빈 값은 그리지 않습니다. 개선 답변 예시가 없거나 타임라인이 비어 있으면
 * 해당 섹션을 숨깁니다. (통합 계약서 규칙)
 */
export default function TurnResultCard({ turn }: Props) {
  return (
    <article className="flex flex-col gap-4 border p-6">
      <header className="flex flex-col gap-1">
        <span className="tabular-nums">질문 {turn.turnId}</span>
        <h3>{turn.question}</h3>
      </header>

      {turn.transcript && (
        <div className="flex flex-col gap-1">
          <h4>내 답변</h4>
          <p>{turn.transcript}</p>
        </div>
      )}

      {turn.scores && (
        <p className="tabular-nums">
          내용 {turn.scores.content} · 말하기 {turn.scores.speech} · 시선 {turn.scores.vision}
        </p>
      )}

      {(turn.strength || turn.weakness) && (
        <div className="flex flex-col gap-1">
          {turn.strength && <p>좋았던 점 — {turn.strength}</p>}
          {turn.weakness && <p>아쉬운 점 — {turn.weakness}</p>}
        </div>
      )}

      {turn.improvedAnswer && (
        <div className="flex flex-col gap-1">
          <h4>이렇게 말해보세요</h4>
          <p>{turn.improvedAnswer}</p>
        </div>
      )}

      {turn.timeline.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4>눈에 띈 구간</h4>
          <ul className="flex flex-col gap-1">
            {turn.timeline.map((mark) => (
              <li key={`${mark.start}-${mark.label}`} className="tabular-nums">
                {formatSeconds(mark.start)} – {formatSeconds(mark.end)} · {mark.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
