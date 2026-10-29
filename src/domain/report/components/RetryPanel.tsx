import { IconRefresh } from '@tabler/icons-react'

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
 * 지금 보여줄 안내입니다. 우선순위는 마지막 시도가 멈춤(`failed`) → 끝까지 돌았지만 또 실패(`stillFailed`) →
 * 아직 안 해 봄 입니다. 실패한 축은 한 번에 같이 돌아서 결과도 보통 같이 옵니다.
 */
function viewOf({ failed, outcomes }: Pick<Props, 'failed' | 'outcomes'>): View {
  const stopped = failed
    .map((item) => outcomes[item.axis])
    .find((outcome): outcome is Extract<RetryOutcome, { kind: 'failed' }> => outcome?.kind === 'failed')
  if (stopped) {
    return {
      title: `${labelsOf(failed)} 항목을 분석하지 못했어요`,
      detail: null,
      error: stopped.message,
      // 다시 해도 결과가 같은 실패(다시 분석할 수 없는 리포트 · 음성 인식 실패)면 버튼을 거둡니다
      showButton: stopped.retryable,
    }
  }

  const stillFailed = failed.filter((item) => outcomes[item.axis]?.kind === 'stillFailed')
  if (stillFailed.length > 0) {
    return {
      title: `${labelsOf(stillFailed)} 항목을 분석하지 못했어요`,
      detail: '총점은 이 항목을 뺀 그대로예요. 잠시 뒤 다시 분석해 보세요.',
      error: null,
      showButton: true,
    }
  }

  return {
    title: `${labelsOf(failed)} 항목을 분석하지 못했어요`,
    detail: '총점은 이 항목을 빼고 계산했어요. 다시 분석해서 점수를 받으면 총점도 새로 계산돼요.',
    error: null,
    showButton: true,
  }
}

/** 화면 읽기 프로그램에 읽어 줄 지금 상태 한 문장 */
function announcementOf({ failed, running, outcomes }: Omit<Props, 'onRetry'>) {
  if (running.length > 0) {
    const runningItems = failed.filter((item) => running.includes(item.axis))
    return `${labelsOf(runningItems.length > 0 ? runningItems : failed)} 항목을 분석하고 있어요`
  }
  const { title, error, detail } = viewOf({ failed, outcomes })
  return [title, error ?? detail].filter(Boolean).join('. ')
}

/**
 * 세부 점수의 "다시 분석" 칸입니다. **분석하지 못한 항목이 있을 때만** 실패한 줄 바로 아래에 하나 둡니다. (#125)
 *
 * 백엔드가 실패한 축(말하기 · 시선)을 한 번에 다시 돌려서(Cue-A/backend#68) 버튼도 하나입니다. 무엇을 다시
 * 분석하는지는 제목에 적습니다 — 줄마다 버튼이 있을 때는 어느 버튼을 눌러도 같은 일이 일어나는 게 보이지 않았습니다.
 *
 * **분석하는 동안에는 칸을 숨깁니다.** 바로 위 실패 줄에 "분석하고 있어요" 가 나와서 같은 말을 두 번 하게 됩니다.
 * 끝나고 또 실패하면 칸이 다시 나타나고, 다 살아나면 칸이 사라지고 절 머리에 "점수가 나왔어요" 가 뜹니다.
 *
 * 다시 분석은 몇십 초가 걸려서 상태가 바뀔 때마다 화면 읽기 프로그램이 읽어야 합니다. 칸이 숨었다 나타나면 그 안의
 * 글은 안내로 읽히지 않을 수 있어서, 안내는 늘 붙어 있는 보이지 않는 한 줄(`role="status"`)이 따로 맡습니다.
 *
 * 바로 아래 보조 지표 카드(회복력 · 머뭇거림)가 회색 판이라, 이 칸은 테두리만 두어 점수 카드로 읽히지 않게 합니다.
 *
 * 실패한 축이 없으면 그리지 않습니다.
 */
export default function RetryPanel({ failed, running, outcomes, onRetry }: Props) {
  if (failed.length === 0 && running.length === 0) return null

  const isRunning = running.length > 0
  const view = isRunning ? null : viewOf({ failed, outcomes })

  return (
    <>
      <p role="status" className="sr-only">
        {announcementOf({ failed, running, outcomes })}
      </p>

      {view && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-neutral-200 p-5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-body-md font-semibold text-neutral-900">{view.title}</p>
            {view.detail && <p className="text-body-sm text-neutral-500">{view.detail}</p>}
            {view.error && <p className="text-body-sm text-semantic-danger">{view.error}</p>}
          </div>

          {view.showButton && (
            <Button size="sm" onClick={onRetry} className="shrink-0 whitespace-nowrap">
              <IconRefresh size={ICON_SIZE} aria-hidden />
              다시 분석
            </Button>
          )}
        </div>
      )}
    </>
  )
}
