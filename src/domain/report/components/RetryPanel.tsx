import { IconLoader2, IconRefresh } from '@tabler/icons-react'

import Button from '@/shared/ui/Button'

import type { RetryOutcome, RetryOutcomes } from '../hooks/useAxisRetry'
import type { RetryAxis } from '../types/report'

/** 실패한 줄 하나. 세부 점수에서 `retryAxis` 가 있는 줄입니다 */
export type FailedAxis = { axis: RetryAxis; label: string }

type Props = {
  /** 지금 실패로 남아 있는 축들. 세부 점수 순서 그대로입니다 */
  failed: FailedAxis[]
  /** 지금 다시 분석 중인 축들. 비어 있으면 안 돌고 있습니다 */
  running: RetryAxis[]
  outcomes: RetryOutcomes
  /** 실패한 축을 전부 다시 분석합니다 */
  onRetry: () => void
}

const ICON_SIZE = 16

const labelsOf = (items: FailedAxis[]) => items.map((item) => item.label).join(' · ')

type View = {
  title: string
  detail: string | null
  /** 빨간 글씨로 보여줄 실패 사유 */
  error: string | null
  showButton: boolean
}

/**
 * 지금 보여줄 안내입니다. 우선순위는 다시 분석 중 → 마지막 시도가 멈춤(`failed`) → 끝까지 돌았지만 또 실패
 * (`stillFailed`) → 아직 안 해 봄 입니다. 실패한 축은 한 번에 같이 돌아서 결과도 보통 같이 옵니다.
 */
function viewOf({ failed, running, outcomes }: Omit<Props, 'onRetry'>): View {
  if (running.length > 0) {
    const runningItems = failed.filter((item) => running.includes(item.axis))
    return {
      title: `${labelsOf(runningItems.length > 0 ? runningItems : failed)} 항목을 다시 분석하고 있어요`,
      detail: '끝나면 위 점수와 총점이 바뀌어요. 몇십 초 걸릴 수 있어요.',
      error: null,
      showButton: true,
    }
  }

  const stopped = failed
    .map((item) => outcomes[item.axis])
    .find((outcome): outcome is Extract<RetryOutcome, { kind: 'failed' }> => outcome?.kind === 'failed')
  if (stopped) {
    return {
      title: `${labelsOf(failed)} 항목을 다시 분석하지 못했어요`,
      detail: null,
      error: stopped.message,
      // 다시 해도 결과가 같은 실패(다시 분석할 수 없는 리포트 · 음성 인식 실패)면 버튼을 거둡니다
      showButton: stopped.retryable,
    }
  }

  const stillFailed = failed.filter((item) => outcomes[item.axis]?.kind === 'stillFailed')
  if (stillFailed.length > 0) {
    return {
      title: `${labelsOf(stillFailed)} 항목은 이번에도 분석을 마치지 못했어요`,
      detail: '총점은 이 항목을 뺀 그대로예요. 잠시 뒤 다시 분석해 보세요.',
      error: null,
      showButton: true,
    }
  }

  return {
    title: `${labelsOf(failed)} 항목을 다시 분석할 수 있어요`,
    detail: '총점은 이 항목을 빼고 계산했어요. 다시 분석해서 점수를 받으면 총점도 새로 계산돼요.',
    error: null,
    showButton: true,
  }
}

/**
 * 세부 점수의 "다시 분석" 칸입니다. 실패한 줄 바로 아래에 하나만 둡니다. (#125)
 *
 * 백엔드가 실패한 축(말하기 · 시선)을 한 번에 다시 돌려서(Cue-A/backend#68) 버튼도 하나입니다. 무엇을 다시
 * 분석하는지는 제목에 적습니다 — 줄마다 버튼이 있을 때는 어느 버튼을 눌러도 같은 일이 일어나는 게 보이지 않았습니다.
 *
 * 다시 분석은 몇십 초가 걸려서, 상태가 바뀌면 화면 읽기 프로그램이 읽도록 칸 전체를 `role="status"` 로 둡니다.
 * 실패 줄에도 상태가 적히지만 소리 안내는 여기 한 번만 합니다.
 *
 * 바로 아래 보조 지표 카드(회복력 · 머뭇거림)가 회색 판이라, 이 칸은 테두리만 두어 점수 카드로 읽히지 않게 합니다.
 *
 * 실패한 축이 없으면 그리지 않습니다.
 */
export default function RetryPanel({ failed, running, outcomes, onRetry }: Props) {
  if (failed.length === 0 && running.length === 0) return null

  const { title, detail, error, showButton } = viewOf({ failed, running, outcomes })
  const isRunning = running.length > 0

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-neutral-200 p-5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body-md font-semibold text-neutral-900">{title}</p>
        {detail && <p className="text-body-sm text-neutral-500">{detail}</p>}
        {error && <p className="text-body-sm text-semantic-danger">{error}</p>}
      </div>

      {showButton && (
        <Button size="sm" onClick={onRetry} disabled={isRunning} className="shrink-0 whitespace-nowrap">
          {isRunning ? (
            <>
              <IconLoader2 size={ICON_SIZE} aria-hidden className="motion-safe:animate-spin" />
              분석 중…
            </>
          ) : (
            <>
              <IconRefresh size={ICON_SIZE} aria-hidden />
              다시 분석
            </>
          )}
        </Button>
      )}
    </div>
  )
}
