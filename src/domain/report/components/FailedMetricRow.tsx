import { IconAlertTriangle, IconLoader2 } from '@tabler/icons-react'

import type { RetryOutcome } from '../hooks/useAxisRetry'
import type { ScoreMetric } from '../types/report'

type Props = {
  metric: ScoreMetric
  /** 이 축을 지금 다시 분석하는 중인지 */
  isRunning: boolean
  /** 이 축을 다시 분석한 마지막 결과. 아직 안 했으면 undefined */
  outcome: RetryOutcome | undefined
}

const ICON_SIZE = 16

/** 이 줄에 적을 상태 한 줄입니다 */
function titleOf(metric: ScoreMetric, isRunning: boolean, outcome: RetryOutcome | undefined) {
  if (isRunning) return `${metric.label} 분석을 다시 하고 있어요`
  if (outcome?.kind === 'stillFailed') return `${metric.label} 분석을 이번에도 마치지 못했어요`
  return `${metric.label} 분석에 실패했어요`
}

/**
 * 세부 점수에서 **분석이 실패한 축** 한 줄입니다. 이 축이 어떤 상태인지만 적습니다.
 *
 * "다시 분석" 버튼은 이 줄에 두지 않고 실패 줄 아래 `RetryPanel` 하나에 모읍니다. 백엔드가 실패한 축을 한 번에
 * 다시 돌려서, 줄마다 버튼을 두면 어느 버튼을 눌러도 같은 일이 일어나는데 그게 보이지 않았습니다. (#125)
 *
 * 미사용(카메라를 안 켬)은 이 줄로 그리지 않습니다. 다시 돌려도 결과가 같고, 실패처럼 보이면 사용자가
 * 서비스 고장으로 읽습니다 — 그 줄은 `ScoreSection` 이 사유 문구만 적습니다.
 *
 * 줄의 칸은 다른 점수 줄과 같습니다(이름 · 가운데 · 오른쪽). 막대 자리에 상태를 적고, 점수 자리는 점수가 없는
 * 다른 줄처럼 `—` 로 둡니다. 상태가 바뀌었다는 소리 안내는 `RetryPanel` 이 한 번만 합니다.
 */
export default function FailedMetricRow({ metric, isRunning, outcome }: Props) {
  return (
    <li className="flex items-center gap-4">
      <span className="w-24 shrink-0 text-body-md text-neutral-700">{metric.label}</span>

      <p className="flex min-w-0 flex-1 items-center gap-1 text-body-md text-neutral-900">
        {isRunning ? (
          <IconLoader2 size={ICON_SIZE} aria-hidden className="shrink-0 text-primary-500 motion-safe:animate-spin" />
        ) : (
          <IconAlertTriangle size={ICON_SIZE} aria-hidden className="shrink-0 text-semantic-warning" />
        )}
        {titleOf(metric, isRunning, outcome)}
      </p>

      <span className="w-24 shrink-0 text-right text-stat text-neutral-300">—</span>
    </li>
  )
}
