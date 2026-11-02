/**
 * 점수 차트 · 변화량을 화면에 그릴 때 쓰는 계산입니다.
 *
 * 성장 관리(회차별 종합 점수 추이 · 이전 회차 대비 변화)와 리포트(회차 비교 섹션, 이슈 #157)가 같은 모양으로 그려야
 * 해서 여기 둡니다. 도메인끼리는 서로의 lib 를 가져다 쓰지 않는 규칙이라 한쪽에 두면 다른 쪽이 쓸 수 없습니다.
 */

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

/** 변화량 한 칸. 오름 · 내림 · 변화 없음 · 비교 불가를 글자와 색으로 함께 나눕니다 (명세 「표시 규칙」) */
export type DeltaView = { text: string; tone: 'up' | 'down' | 'flat' | 'unknown' }

export function deltaView(delta: number | null): DeltaView {
  if (delta === null) return { text: '비교 불가', tone: 'unknown' }
  if (delta === 0) return { text: '변화 없음', tone: 'flat' }
  return delta > 0 ? { text: `▲${delta}`, tone: 'up' } : { text: `▼${Math.abs(delta)}`, tone: 'down' }
}

/** 화면 읽기 프로그램용 변화량. ▲ ▼ 기호는 읽어 주지 않는 경우가 있어 말로 바꿉니다 */
export function spokenDelta(delta: number | null): string {
  if (delta === null) return '비교 불가'
  if (delta === 0) return '변화 없음'
  return delta > 0 ? `${delta}점 오름` : `${Math.abs(delta)}점 내림`
}

/** 변화량 글자 색. 오르면 초록 · 내리면 빨강 · 그대로면 회색 */
export const DELTA_TONE_CLASS: Record<DeltaView['tone'], string> = {
  up: 'text-badge-success-text',
  down: 'text-badge-danger-text',
  flat: 'text-neutral-500',
  unknown: 'text-neutral-400',
}
