import Badge from '@/shared/ui/Badge'
import Card from '@/shared/ui/Card'

import type { ReportSummary } from '../types/report'

/** 면접 흐름의 상태 라벨 색입니다. 모르는 값이면 회색으로 떨어뜨립니다. */
const STATUS_TONE: Record<string, 'success' | 'info' | 'warning'> = {
  안정: 'success',
  보통: 'info',
  흔들림: 'warning',
}

type Props = {
  summary: ReportSummary
  /** 소제목에 쓰는 '기획 직무 · 2026.07.18' */
  subtitle: string
}

/**
 * 이번 면접 요약입니다. (C-01 "이번 면접 요약")
 * 한 줄 총평 → 면접 개요 → 면접 흐름 → 잘한 점 / 아쉬운 점 순서입니다.
 *
 * 한 줄 총평과 문항 코멘트는 AI 가 쓰는 글이라 **생성에 실패하면 null** 로 옵니다. 그때는 그 칸만 그리지
 * 않습니다. 점수 · 흐름 같은 나머지 값은 그대로 와서, 빈 칸에 "만들지 못했어요" 를 적으면 실패가 리포트의
 * 주인공처럼 보입니다. 다시 만들 방법도 없어서 사용자가 할 일이 없습니다.
 */
export default function SummarySection({ summary, subtitle }: Props) {
  return (
    <Card label="이번 면접 요약" padding="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-h2 text-neutral-900">이번 면접 요약</h2>
          <p className="text-body-sm text-neutral-500">{subtitle}</p>
        </div>

        {summary.verdict && (
          <p className="rounded-sm bg-primary-100 p-5 text-body-md text-neutral-900">
            {summary.verdict}
          </p>
        )}

        {/*
          카드 사이 간격은 아래 잘한 점 / 아쉬운 점과 같은 gap-3 입니다. 간격 없이 붙이면 둥근 모서리끼리
          맞닿은 자리가 파여서 카드가 겹친 것처럼 보입니다. (#28 에서 테두리 칸을 둥근 카드로 바꾸며 생긴 것)
        */}
        {summary.overview.length > 0 && (
          <dl className="flex flex-wrap gap-3">
            {summary.overview.map((fact) => (
              <div key={fact.key} className="min-w-40 flex-1 rounded-sm bg-neutral-50 p-4">
                <dt className="text-body-sm text-neutral-500">{fact.label}</dt>
                <dd className="text-body-lg tabular-nums text-neutral-900">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {summary.turns.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-body-lg text-neutral-900">면접 흐름</h3>

            <ul className="flex flex-col">
              {summary.turns.map((turn) => (
                <li
                  key={turn.turnId}
                  className="flex items-start gap-4 border-b border-neutral-200 p-4 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-body-lg text-neutral-900">{turn.title}</p>
                    {turn.comment && <p className="text-body-sm text-neutral-500">{turn.comment}</p>}
                  </div>

                  <Badge tone={STATUS_TONE[turn.status] ?? 'neutral'}>{turn.status}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {summary.strengths.length > 0 && (
            <div className="min-w-64 flex-1 rounded-sm bg-badge-success-bg p-5">
              <h3 className="text-body-lg text-badge-success-text">잘한 점</h3>
              <ul className="mt-2 flex flex-col gap-1 text-body-md text-neutral-700">
                {summary.strengths.map((item) => (
                  <li key={item.text}>{item.text}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.weaknesses.length > 0 && (
            <div className="min-w-64 flex-1 rounded-sm bg-badge-warning-bg p-5">
              <h3 className="text-body-lg text-badge-warning-text">아쉬운 점</h3>
              <ul className="mt-2 flex flex-col gap-1 text-body-md text-neutral-700">
                {summary.weaknesses.map((item) => (
                  <li key={item.text}>{item.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
