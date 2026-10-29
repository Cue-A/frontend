import { formatDate } from '@/shared/lib/formatDate'

import type { PracticePersona, PracticeSession, PracticeStatusTab } from '../types/practice'

/**
 * 연습 기록 목록에 보여줄 글자를 만듭니다. 화면은 이 함수들의 결과만 그립니다.
 */

/** 한 쪽에 보여줄 세션 수 */
export const PRACTICE_PAGE_SIZE = 10

/** 폴더 이름 상한(글자 수). 백엔드 `folder.folder_name VARCHAR(50)` 과 같습니다. 앞뒤 공백을 뺀 길이로 셉니다 */
export const MAX_FOLDER_NAME_LENGTH = 50

export const PRACTICE_STATUS_TABS: { value: PracticeStatusTab; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'IN_PROGRESS', label: '진행 중' },
]

/** 옵션 설정(A-05)의 면접관 스타일 이름과 같습니다 */
const PERSONA_LABEL: Record<PracticePersona, string> = {
  FRIENDLY: '친절한 면접관',
  PRESSURE: '압박 면접관',
}

/** `삼성전자 · 마케팅 직무 · 압박 면접관`. 기업을 고르지 않은 세션은 "기업 직접 입력" 으로 시작합니다 */
export function titleOf(session: PracticeSession): string {
  return [session.companyName ?? '기업 직접 입력', session.jobRole, PERSONA_LABEL[session.persona]].join(' · ')
}

/**
 * 제목 아래 한 줄. 상태에 따라 붙는 말이 다릅니다.
 * - 완료 `2026.08.02 · 질문 9문항 · 종합 84점` (점수가 아직 없으면 점수는 빼고)
 * - 진행 중 `2026.07.20 · 진행 중`
 * - 중단 `2026.07.18 · 중간에 그만둔 연습`
 */
export function metaOf(session: PracticeSession): string {
  const date = formatDate(session.startedAt)

  switch (session.status) {
    case 'IN_PROGRESS':
      return `${date} · 진행 중`
    case 'ABORTED':
      return `${date} · 중간에 그만둔 연습`
    case 'COMPLETED': {
      const parts = [date, `질문 ${session.questionCount}문항`]
      if (session.totalScore !== null) parts.push(`종합 ${session.totalScore}점`)
      return parts.join(' · ')
    }
  }
}
