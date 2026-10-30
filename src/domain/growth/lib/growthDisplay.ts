import type { WeeklyGoal } from '../types/growth'

/**
 * 성장 관리 화면에 보여줄 글자와 숫자를 만듭니다. 화면은 이 함수들의 결과만 그립니다.
 */

/** 점수 추이에 그릴 최대 회차 수. 넘으면 최근 회차부터 이만큼만 그립니다 — 막대가 너무 가늘어집니다 */
export const MAX_ROUNDS_SHOWN = 8

/** 이번 주 목표로 고를 수 있는 횟수. 하루 한 번씩 일주일이 끝입니다 */
export const WEEKLY_GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const

/** 일정 제목 상한(글자 수). 앞뒤 공백을 뺀 길이로 셉니다 */
export const MAX_EVENT_TITLE_LENGTH = 50

/** 메모 상한(글자 수) */
export const MAX_EVENT_MEMO_LENGTH = 300

/**
 * 막대 차트의 세로축입니다. 맨 위는 늘 100점이고, 맨 아래는 가장 낮은 점수보다 한 칸 아래의 20점 단위입니다.
 *
 * 0점부터 그리면 68점과 82점이 거의 같은 높이로 보여서 달라진 게 안 보입니다. 시안(68 ~ 82점 → 40 ~ 100)과 같은 방식입니다.
 */
export function scoreAxis(scores: number[]) {
  const lowest = Math.min(...scores)
  const min = Math.max(0, Math.min(80, Math.floor((lowest - 10) / 20) * 20))
  const ticks: number[] = []
  for (let tick = 100; tick > min; tick -= 20) ticks.push(tick)
  return { min, max: 100, ticks }
}

/** 축 범위 안에서 막대 높이(%). 축보다 낮은 점수도 막대가 보이도록 아주 조금은 남깁니다 */
export function barHeightPercent(score: number, axis: { min: number; max: number }) {
  const ratio = (score - axis.min) / (axis.max - axis.min)
  return Math.max(2, Math.min(100, ratio * 100))
}

export function goalMessage({ done, target }: WeeklyGoal) {
  const remaining = target - done
  return remaining > 0 ? `${remaining}회만 더 하면 목표 달성이에요` : '이번 주 목표를 달성했어요!'
}
