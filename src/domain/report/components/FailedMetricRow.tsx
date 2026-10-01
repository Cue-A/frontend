import { IconAlertTriangle, IconLoader2, IconRefresh } from '@tabler/icons-react'

import Button from '@/shared/ui/Button'

import type { RetryOutcome } from '../hooks/useAxisRetry'
import type { RetryAxis, ScoreMetric } from '../types/report'

type Props = {
  metric: ScoreMetric
  /** 다시 분석할 축. `metric.retryAxis` 가 있는 줄만 이 컴포넌트로 그립니다 */
  axis: RetryAxis
  /** 지금 다시 분석 중인 축. 이 줄이 아니어도 다른 줄이 돌고 있으면 버튼을 잠급니다 */
  running: RetryAxis | null
  /** 이 축을 다시 분석한 마지막 결과. 아직 안 했으면 undefined */
  outcome: RetryOutcome | undefined
  onRetry: (axis: RetryAxis) => void
}

const ICON_SIZE = 16

/** 지금 상태에서 보여줄 제목 · 설명 · 버튼입니다 */
function describe({ metric, axis, running, outcome }: Omit<Props, 'onRetry'>) {
  if (running === axis) {
    return {
      title: `${metric.label} 분석을 다시 하고 있어요`,
      detail: '끝나면 이 자리에 점수가 나와요.',
      error: null,
      showButton: true,
      blockedReason: null,
    }
  }

  const title =
    outcome?.kind === 'stillFailed'
      ? `${metric.label} 분석을 이번에도 마치지 못했어요`
      : `${metric.label} 분석에 실패했어요`

  const detail =
    outcome?.kind === 'stillFailed'
      ? '총점은 이 항목을 뺀 그대로예요. 잠시 뒤 다시 분석해 보세요.'
      : '총점은 이 항목을 빼고 계산했어요. 다시 분석해서 점수를 받으면 총점도 새로 계산돼요.'

  return {
    title,
    detail,
    error: outcome?.kind === 'failed' ? outcome.message : null,
    // 다시 해도 결과가 같은 실패(없는 API · 고칠 수 없는 요청)면 버튼을 거둡니다
    showButton: outcome?.kind !== 'failed' || outcome.retryable,
    // 못 누르는 이유는 툴팁이 아니라 글로 적습니다 (Button 의 title 주석)
    blockedReason: running !== null ? '다른 항목을 다시 분석하는 중이라, 끝난 뒤에 누를 수 있어요.' : null,
  }
}

/**
 * 세부 점수에서 **분석이 실패한 축** 한 줄입니다. 실패 사유와 "다시 분석" 버튼을 같이 둡니다.
 *
 * 미사용(카메라를 안 켬)은 이 줄로 그리지 않습니다. 다시 돌려도 결과가 같고, 실패처럼 보이면 사용자가
 * 서비스 고장으로 읽습니다 — 그 줄은 `ScoreSection` 이 사유 문구만 적습니다.
 *
 * 줄의 칸은 다른 점수 줄과 같습니다(이름 · 가운데 · 오른쪽). 막대 자리에 사유를, 점수 자리에 버튼을
 * 둬서 줄이 바뀌어도 눈이 같은 자리에서 찾습니다.
 *
 * 상태가 바뀌면 화면 읽기 프로그램이 읽도록 가운데 칸을 `role="status"` 로 둡니다. 다시 분석은 몇십 초가
 * 걸려서, 버튼을 누른 뒤 결과를 소리로 알려주지 않으면 끝났는지 알 수 없습니다.
 */
export default function FailedMetricRow({ metric, axis, running, outcome, onRetry }: Props) {
  const { title, detail, error, showButton, blockedReason } = describe({ metric, axis, running, outcome })
  const isRunning = running === axis

  return (
    <li className="flex items-start gap-4">
      <span className="w-24 shrink-0 text-body-md text-neutral-700">{metric.label}</span>

      <div role="status" className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex items-center gap-1 text-body-md text-neutral-900">
          {isRunning ? (
            <IconLoader2
              size={ICON_SIZE}
              aria-hidden
              className="shrink-0 text-primary-500 motion-safe:animate-spin"
            />
          ) : (
            <IconAlertTriangle size={ICON_SIZE} aria-hidden className="shrink-0 text-semantic-warning" />
          )}
          {title}
        </p>
        <p className="text-body-sm text-neutral-500">{detail}</p>
        {error && <p className="text-body-sm text-semantic-danger">{error}</p>}
        {!isRunning && blockedReason && <p className="text-body-sm text-neutral-500">{blockedReason}</p>}
      </div>

      {/* 버튼이 점수 칸(w-24)보다 넓어서 최소 너비로 둡니다. 오른쪽 끝은 다른 줄의 점수와 맞습니다 */}
      <div className="flex min-w-24 shrink-0 justify-end">
        {showButton && (
          <Button
            size="sm"
            onClick={() => onRetry(axis)}
            disabled={running !== null}
            className="whitespace-nowrap"
          >
            {isRunning ? (
              '분석 중…'
            ) : (
              <>
                <IconRefresh size={ICON_SIZE} aria-hidden />
                다시 분석
              </>
            )}
          </Button>
        )}
      </div>
    </li>
  )
}
