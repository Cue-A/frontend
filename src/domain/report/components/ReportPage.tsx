import { useParams } from 'react-router-dom'

import { useReport } from '../hooks/useReport'

import ReportActions from './ReportActions'
import ScoreBoard from './ScoreBoard'
import TurnResultCard from './TurnResultCard'

/**
 * 면접 리포트 화면입니다. (C 파트)
 *
 * 8/5 회의 결정에 맞춰 1열 스크롤로 쌓고, 종합 점수는 맨 위 오른쪽에 둡니다.
 * 색·타이포는 토큰이 dev 에 들어온 뒤에 한 번에 입힙니다.
 * 지금 임의 클래스를 쓰면 나중에 전부 되돌려야 해서 구조만 먼저 잡았습니다.
 */
export default function ReportPage() {
  const { reportId } = useParams()
  const { data, isLoading, error } = useReport(reportId)

  if (isLoading) {
    return <p>리포트를 불러오는 중이에요…</p>
  }

  if (error || !data) {
    return (
      <section className="flex flex-col items-start gap-4">
        <p>{error ?? '리포트를 찾을 수 없어요.'}</p>
        <ReportActions />
      </section>
    )
  }

  const { summary } = data

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1>면접 리포트</h1>
          <p>
            {data.companyName ? `${data.companyName} · ` : ''}
            {data.jobRole}
          </p>
          {/* 회차 선택은 지난 리포트 목록 API 가 나오면 셀렉트로 바꿉니다 */}
          <p className="tabular-nums">
            {data.attempt}회차 / 총 {data.totalAttempts}회
          </p>
        </div>

        <p className="tabular-nums" aria-label="종합 점수">
          종합 {data.scores.total}점
        </p>
      </header>

      <ScoreBoard scores={data.scores} />

      <section aria-label="이번 면접 요약" className="flex flex-col gap-4">
        <h2>이번 면접 요약</h2>
        <p>{summary.overallComment}</p>

        {summary.strengths.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3>잘한 점</h3>
            <ul className="flex flex-col gap-1">
              {summary.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {summary.weaknesses.length > 0 && (
          <div className="flex flex-col gap-1">
            <h3>아쉬운 점</h3>
            <ul className="flex flex-col gap-1">
              {summary.weaknesses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {summary.priorityImprovement && (
          <div className="flex flex-col gap-1">
            <h3>다음에 먼저 고쳐볼 것</h3>
            <p>{summary.priorityImprovement}</p>
          </div>
        )}

        {/* 첫 연습이면 growthNarrative 가 null 입니다 */}
        <p>{summary.growthNarrative ?? '첫 연습이에요. 다음 회차부터 변화를 보여드릴게요.'}</p>
      </section>

      <section aria-label="질문별 결과" className="flex flex-col gap-4">
        <h2>질문별 결과</h2>
        {data.turns.map((turn) => (
          <TurnResultCard key={turn.turnId} turn={turn} />
        ))}
      </section>

      <ReportActions />
    </section>
  )
}
