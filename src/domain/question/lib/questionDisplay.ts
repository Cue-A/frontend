import type { Question, QuestionOrigin, QuestionTab } from '../types/question'

/**
 * 질문 은행 목록에 보여줄 글자를 만듭니다. 화면은 이 함수들의 결과만 그립니다.
 */

/** 한 쪽에 보여줄 질문 수 */
export const QUESTION_PAGE_SIZE = 10

/**
 * 시안의 탭은 "전체 · 즐겨찾기 · 최근 생성" 인데 이슈 #138 에서 "전체 · 공통 질문 · 북마크" 로 바꿨습니다.
 * 목록은 늘 최신순이라 "최근 생성" 탭이 따로 필요 없습니다.
 */
export const QUESTION_TABS: { value: QuestionTab; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'COMMON', label: '공통 질문' },
  { value: 'BOOKMARKED', label: '북마크' },
]

const ORIGIN_LABEL: Record<QuestionOrigin, string> = {
  COMMON: '공통',
  COMPANY: '기업 맞춤',
}

/**
 * 질문 아래 한 줄. 출처에 따라 마지막 칸이 다릅니다.
 * - 공통 `공통 · 인성 · 연습 3회` (한 번도 안 했으면 `아직 연습 안 함`)
 * - 기업 맞춤 `기업 맞춤 · 지원동기 · 네이버`
 * 기업 이름이나 연습 횟수를 서버가 못 주면(null) 그 칸은 뺍니다.
 */
export function metaOf(question: Question): string {
  const parts = [ORIGIN_LABEL[question.origin], question.category]

  if (question.origin === 'COMPANY') {
    if (question.companyName) parts.push(question.companyName)
  } else if (question.practiceCount !== null) {
    parts.push(question.practiceCount === 0 ? '아직 연습 안 함' : `연습 ${question.practiceCount}회`)
  }

  return parts.join(' · ')
}
