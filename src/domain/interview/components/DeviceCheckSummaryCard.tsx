import { useMemo } from 'react'

import { recallSessionOptions, recallSessionSummary } from '../api/sessionOptionsDraft'
import { useInterviewSessionOptions } from '../hooks/useInterviewSessionOptions'
import { summaryRowsOfSession, summaryRowsOfSetup, type DeviceCheckSummaryRow } from '../lib/deviceCheckSummary'
import type { SessionSetup } from '../types/sessionSetup'

import Card from '@/shared/ui/Card'

type DeviceCheckSummaryCardProps = {
  /** 주소의 세션 id. 없으면 값을 알 수 없어 빈 표시만 둡니다 */
  sessionId: string | undefined
  /** 재연습이면 재연습 화면이 화면 이동 값으로 넘긴 조건입니다 (이슈 #152). 이 경우 세션을 다시 읽지 않습니다 */
  replaySetup: SessionSetup | null
}

const NOT_FOUND_MESSAGE = '면접 정보를 찾을 수 없어요.'
const FAILED_MESSAGE = '면접 정보를 불러오지 못했어요. 장치 점검과 면접 시작은 그대로 할 수 있어요.'

function SummaryCardShell({ rows, notice }: { rows: DeviceCheckSummaryRow[]; notice?: string }) {
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <h2 className="text-body-lg font-semibold text-neutral-900">면접 요약</h2>
      <dl className="flex flex-col">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between gap-4 border-b border-neutral-200 py-2.5 last:border-b-0"
          >
            <dt className="text-body-sm text-neutral-500">{label}</dt>
            {value !== null ? (
              <dd className="text-body-sm font-semibold text-neutral-900">{value}</dd>
            ) : (
              <dd className="text-body-sm text-neutral-300" aria-label="값 없음">
                -
              </dd>
            )}
          </div>
        ))}
      </dl>
      {notice && (
        <p role="status" className="text-body-sm text-neutral-500">
          {notice}
        </p>
      )}
    </Card>
  )
}

/**
 * 서버에 저장된 세션 옵션으로 채우는 요약입니다. (이슈 #132)
 *
 * 옵션 설정의 지금 값이 아니라 **이 세션을 만들 때의 값**을 보여줍니다. 면접관 · 답변 시간은 세션 옵션(같은 탭이면 만들 때
 * 남긴 저장값, 아니면 `GET /api/interviews/{sessionId}`)이고, 직무 · 질문 수는 조회 API 에 없어서 만들 때 남긴 값입니다.
 * 새로 연 탭 · 다른 기기에서는 이 둘이 빈 표시("-")입니다.
 *
 * 불러오는 중에는 빈 표시이고, 실패해도 장치 점검과 "면접 시작하기" 는 막지 않습니다 — 요약은 참고용입니다.
 */
function SessionSummaryCard({ sessionId }: { sessionId: string }) {
  const result = useInterviewSessionOptions(sessionId)
  // 이 탭에 남긴 값은 바로 읽을 수 있어서, 훅이 비동기로 답하기 전(로딩) 한 프레임 "-" 로 깜빡이지 않게 먼저 씁니다.
  // 렌더마다 저장소를 읽고(남긴 값이 깨져 있으면 지우기까지) 하지 않도록 세션이 바뀔 때만 읽습니다.
  const remembered = useMemo(
    () => ({ options: recallSessionOptions(sessionId), summary: recallSessionSummary(sessionId) }),
    [sessionId],
  )
  const options = result.status === 'ready' ? result.options : remembered.options
  const rows = summaryRowsOfSession(options, remembered.summary)

  if (result.status !== 'error') return <SummaryCardShell rows={rows} />

  return <SummaryCardShell rows={rows} notice={result.error.code === 'SESSION_NOT_FOUND' ? NOT_FOUND_MESSAGE : FAILED_MESSAGE} />
}

export default function DeviceCheckSummaryCard({ sessionId, replaySetup }: DeviceCheckSummaryCardProps) {
  if (replaySetup) return <SummaryCardShell rows={summaryRowsOfSetup(replaySetup)} />
  if (!sessionId) return <SummaryCardShell rows={summaryRowsOfSession(null, null)} />

  return <SessionSummaryCard sessionId={sessionId} />
}
