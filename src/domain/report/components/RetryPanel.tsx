import { IconRefresh } from '@tabler/icons-react'
import { useEffect, useRef, type RefObject } from 'react'

import Button from '@/shared/ui/Button'

import type { RetryOutcomes } from '../hooks/useAxisRetry'
import { viewOf, type FailedAxis } from '../lib/retryView'
import type { RetryAxis } from '../types/report'

type Props = {
  /** 지금 실패로 남아 있는 축들. 세부 점수 순서 그대로입니다 */
  failed: FailedAxis[]
  /** 지금 다시 분석 중인 축들. 비어 있으면 안 돌고 있습니다 */
  running: RetryAxis[]
  outcomes: RetryOutcomes
  /** 실패한 축을 전부 다시 분석합니다 */
  onRetry: () => void
  /**
   * 칸이 숨는 동안 포커스를 맡길 곳(절 머리). 늘 그려져 있어야 합니다. 누른 버튼이 칸과 함께 사라지면 포커스가
   * `body` 로 빠져서, 키보드 · 화면 읽기 프로그램 사용자가 어디에 있었는지 잃습니다. (PR #134 리뷰)
   */
  focusFallbackRef: RefObject<HTMLElement | null>
}

const ICON_SIZE = 16

/** 포커스를 옮겨도 화면은 그대로 둡니다. 절 머리가 화면 밖이면 옮기는 순간 페이지가 위로 뜁니다 */
const FOCUS_OPTIONS: FocusOptions = { preventScroll: true }

/**
 * 세부 점수의 "다시 분석" 칸입니다. **분석하지 못한 항목이 있을 때만** 실패한 줄 바로 아래에 하나 둡니다. (#125)
 *
 * 백엔드가 실패한 축(말하기 · 시선)을 한 번에 다시 돌려서(Cue-A/backend#68) 버튼도 하나입니다. 무엇을 다시
 * 분석하는지는 제목에 적습니다 — 줄마다 버튼이 있을 때는 어느 버튼을 눌러도 같은 일이 일어나는 게 보이지 않았습니다.
 *
 * **분석하는 동안에는 칸을 숨깁니다.** 바로 위 실패 줄에 "분석하고 있어요" 가 나와서 같은 말을 두 번 하게 됩니다.
 * 끝나고 또 실패하면 칸이 다시 나타나고, 다 살아나면 칸이 사라지고 절 머리에 "점수가 나왔어요" 가 뜹니다.
 *
 * **포커스** — 버튼을 누르면 칸이 숨기 전에 포커스를 절 머리(`focusFallbackRef`)로 옮깁니다. 끝나고 칸이 다시
 * 나타났을 때 포커스가 아직 거기(또는 `body`)에 있으면 "다시 분석" 버튼으로 돌려놓습니다 — 버튼이 없는 실패면 칸으로
 * 옮겨 사유를 읽게 합니다. 기다리는 동안 사용자가 다른 곳으로 옮겼으면 건드리지 않습니다. 다 살아나면 포커스는
 * 절 머리에 그대로 있고, 바뀐 점수는 안내 줄이 읽습니다. (PR #134 리뷰)
 *
 * 다시 분석은 몇십 초가 걸려서 상태가 바뀔 때마다 화면 읽기 프로그램이 읽어야 합니다. 그 안내는 `ScoreSection` 의
 * 늘 붙어 있는 보이지 않는 한 줄이 맡습니다 (`lib/retryView.ts` 의 `retryAnnouncementOf`).
 *
 * 바로 아래 보조 지표 카드(회복력 · 머뭇거림)가 회색 판이라, 이 칸은 테두리만 두어 점수 카드로 읽히지 않게 합니다.
 *
 * 실패한 축이 없거나 분석 중이면 그리지 않습니다.
 */
export default function RetryPanel({ failed, running, outcomes, onRetry, focusFallbackRef }: Props) {
  const isRunning = running.length > 0
  const view = isRunning ? null : viewOf({ failed, outcomes })
  const shown = view !== null

  const boxRef = useRef<HTMLDivElement | null>(null)
  const wasRunningRef = useRef(isRunning)

  // 분석이 끝나 칸이 다시 나타난 순간에만 포커스를 돌려놓습니다
  useEffect(() => {
    const wasRunning = wasRunningRef.current
    wasRunningRef.current = isRunning
    if (!wasRunning || isRunning || !shown) return

    const active = document.activeElement
    if (active !== document.body && active !== focusFallbackRef.current) return

    const box = boxRef.current
    const target = box?.querySelector('button') ?? box
    target?.focus(FOCUS_OPTIONS)
  }, [isRunning, shown, focusFallbackRef])

  if (!view) return null

  const handleRetry = () => {
    focusFallbackRef.current?.focus(FOCUS_OPTIONS)
    onRetry()
  }

  return (
    <div
      ref={boxRef}
      // 버튼이 없는 실패에서 칸 자체로 포커스를 옮길 때만 씁니다. 탭 순서에는 넣지 않습니다
      tabIndex={-1}
      className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-neutral-200 p-5 outline-none"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body-md font-semibold text-neutral-900">{view.title}</p>
        {view.detail && <p className="text-body-sm text-neutral-500">{view.detail}</p>}
        {view.error && <p className="text-body-sm text-semantic-danger">{view.error}</p>}
      </div>

      {view.showButton && (
        <Button size="sm" onClick={handleRetry} className="shrink-0 whitespace-nowrap">
          <IconRefresh size={ICON_SIZE} aria-hidden />
          다시 분석
        </Button>
      )}
    </div>
  )
}
