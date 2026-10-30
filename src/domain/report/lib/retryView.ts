import type { RetryOutcome, RetryOutcomes } from '../hooks/useAxisRetry'
import type { RetryAxis } from '../types/report'

/**
 * 세부 점수 "다시 분석" 의 문구를 정합니다. 화면에 보이는 칸(`RetryPanel`)과 화면 읽기 프로그램 안내 줄
 * (`ScoreSection`)이 같은 문구를 쓰도록 여기 한 곳에 둡니다. (#125 · PR #134 리뷰)
 */

/** 실패한 줄 하나. 세부 점수에서 `retryAxis` 가 있는 줄입니다 */
export type FailedAxis = { axis: RetryAxis; label: string }

type RetryState = {
  /** 지금 실패로 남아 있는 축들. 세부 점수 순서 그대로입니다 */
  failed: FailedAxis[]
  /** 지금 다시 분석 중인 축들. 비어 있으면 안 돌고 있습니다 */
  running: RetryAxis[]
  outcomes: RetryOutcomes
}

const labelsOf = (items: FailedAxis[]) => items.map((item) => item.label).join(' · ')

export type RetryView = {
  title: string
  detail: string | null
  /** 빨간 글씨로 보여줄 실패 사유 */
  error: string | null
  showButton: boolean
}

/**
 * 다시 분석 칸에 보여줄 안내입니다. 실패한 축이 없으면 null 입니다.
 *
 * 우선순위는 마지막 시도가 멈춤(`failed`) → 끝까지 돌았지만 또 실패(`stillFailed`) → 아직 안 해 봄 입니다. 실패한 축은
 * 한 번에 같이 돌아서 결과도 보통 같이 옵니다.
 */
export function viewOf({ failed, outcomes }: Pick<RetryState, 'failed' | 'outcomes'>): RetryView | null {
  if (failed.length === 0) return null

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

/**
 * 화면 읽기 프로그램에 읽어 줄 다시 분석 상태 한 문장입니다. 읽을 게 없으면 null 입니다.
 *
 * 안내 줄(`role="status"`)은 다시 분석 칸이 아니라 `ScoreSection` 이 늘 그려 둡니다. 칸은 숨었다 나타나고 다 살아나면
 * 아예 사라져서, 칸 안에 두면 새로 그려진 안내 줄을 읽지 않는 화면 읽기 프로그램이 있습니다. (PR #134 리뷰)
 */
export function retryAnnouncementOf({ failed, running, outcomes }: RetryState): string | null {
  if (running.length > 0) {
    const runningItems = failed.filter((item) => running.includes(item.axis))
    const labels = labelsOf(runningItems.length > 0 ? runningItems : failed)
    // 새로고침해서 서버가 돌리던 재시도를 이어 받으면, 리포트를 다시 받기 전까지 실패한 줄을 모를 수 있습니다
    return labels ? `${labels} 항목을 분석하고 있어요` : '점수를 분석하고 있어요'
  }
  const view = viewOf({ failed, outcomes })
  if (!view) return null
  return [view.title, view.error ?? view.detail].filter(Boolean).join('. ')
}
