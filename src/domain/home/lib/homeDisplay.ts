import type { InterviewKind, MonthlyActivity } from '../types/home'

import { daysBetween, parseIsoDate, startOfToday } from './homeDate'

/** 배지 · 아이콘 칸에 쓰는 톤. `shared/ui/Badge` 의 tone 과 같은 이름입니다 */
type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/**
 * 리포트 점수 배지 색. 시안의 87 · 91 은 초록, 78 은 주황입니다.
 * 기준선은 시안에 없어서 그 셋이 갈리는 자리로 정했습니다 — 리포트 화면에 같은 규칙이 생기면 그쪽을 따릅니다.
 */
export function scoreTone(score: number): Tone {
  if (score >= 85) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

/** 최근 리포트 행 왼쪽 네모. 시안: BE(보라) · FE(파랑) · 인성(주황) */
export const INTERVIEW_KIND_DISPLAY: Record<InterviewKind, { short: string; tone: Tone }> = {
  BACKEND: { short: 'BE', tone: 'brand' },
  FRONTEND: { short: 'FE', tone: 'info' },
  PERSONALITY: { short: '인성', tone: 'warning' },
  OTHER: { short: '기타', tone: 'neutral' },
}

/**
 * 이번 달 카드 아래 줄. 시안 문구는 "지난달보다 +5일" 인데, 비교 기준이 지난달 같은 기간이라
 * (types/home.ts `diffFromLastMonth`) "이맘때" 를 붙였습니다.
 */
export function monthlyDiffText({ activeDays, diffFromLastMonth }: MonthlyActivity): string {
  if (diffFromLastMonth === null) return activeDays === 0 ? '아직 기록이 없어요' : '지난달 기록이 없어요'
  if (diffFromLastMonth === 0) return '지난달 이맘때와 같아요'
  return `지난달 이맘때보다 ${diffFromLastMonth > 0 ? '+' : ''}${diffFromLastMonth}일`
}

/** 일주일 안으로 다가온 일정은 빨갛게 보여줍니다 (토큰 `semantic-danger` 용도: "D-day") */
const URGENT_WITHIN_DAYS = 7

export function dDayOf(isoDate: string, today: Date = startOfToday()) {
  const days = daysBetween(today, parseIsoDate(isoDate))
  return {
    label: days === 0 ? 'D-DAY' : days > 0 ? `D-${days}` : `D+${-days}`,
    urgent: days >= 0 && days <= URGENT_WITHIN_DAYS,
  }
}
