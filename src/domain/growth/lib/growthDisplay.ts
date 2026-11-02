import type { WeeklyGoal } from '../types/growth'

/**
 * 성장 관리 화면에 보여줄 글자와 숫자를 만듭니다. 화면은 이 함수들의 결과만 그립니다.
 */

/** 이번 주 목표로 고를 수 있는 횟수. 하루 한 번씩 일주일이 끝입니다 */
export const WEEKLY_GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const

/** 일정 제목 상한(글자 수). 앞뒤 공백을 뺀 길이로 셉니다 */
export const MAX_EVENT_TITLE_LENGTH = 50

/** 메모 상한(글자 수) */
export const MAX_EVENT_MEMO_LENGTH = 300

/*
  변화량 · 막대 차트 계산과 축 이름 · 최대 회차 수는 리포트의 회차 비교 섹션(이슈 #157)도 같이 써서
  `shared/lib/scoreDisplay.ts` 로 옮겼습니다. 성장 관리 화면은 지금처럼 여기서 가져다 씁니다.
*/
export {
  barHeightPercent,
  deltaView,
  MAX_ROUNDS_SHOWN,
  SCORE_AXIS_LABEL as AXIS_LABEL,
  scoreAxis,
  spokenDelta,
  type DeltaView,
} from '@/shared/lib/scoreDisplay'

export function goalMessage({ done, target }: WeeklyGoal) {
  const remaining = target - done
  return remaining > 0 ? `${remaining}회만 더 하면 목표 달성이에요` : '이번 주 목표를 달성했어요!'
}
