import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { QuestionListResponse, QuestionResponse } from './questionResponse'

/**
 * 질문 은행 목업입니다. **백엔드에 질문 은행 API 가 없어서** `questions` 를 `VITE_REAL_APIS` 에 넣어도 이 API 들은
 * 목업이 답합니다. (이슈 #138)
 *
 * ── 백엔드가 만들었을 때 바꿀 것 ────────────────────────────────────────────────
 * 1. 아래 `registerMock` 세 개의 `{ missingInBackend: MISSING }` 을 지웁니다. 그러면 실제 서버로 갑니다
 * 2. 응답 모양이 다르면 `questionResponse.ts` 의 변환 함수(`toQuestion` · `toQuestionPage`)를 고칩니다
 * 3. 경로가 바뀌면 `questionApi.ts` 의 경로를 고칩니다. 도메인 조각(`/api/questions` 의 `questions`)이 바뀌면
 *    `VITE_REAL_APIS` 에 넣는 이름도 바뀝니다 (shared/api/mock.ts `isRealApi`)
 * 4. 이 파일은 다른 곳에서 가져다 쓰지 않으니 통째로 지우고, `questionApi.ts` 맨 위의 `import './questionMock'` 도
 *    같이 지웁니다
 * TODO(백엔드): 목록은 본 질문만 내려줘야 합니다. 꼬리질문 · 재질문은 서버가 걸러 주세요 (ERD `question.type` ·
 * `is_replay`). 이 목업에는 본 질문만 넣었습니다
 * ────────────────────────────────────────────────────────────────────────────
 *
 * 질문 26개는 시안의 "26개 항목" 에 맞췄고, 위쪽 다섯 개는 시안의 문장입니다. 날짜는 홈 · 연습 기록 목업처럼
 * **오늘 기준**으로 만듭니다. 저장은 메모리에만 합니다 — 북마크는 새로고침하면 처음으로 돌아갑니다.
 */

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

type StoredQuestion = Omit<QuestionResponse, 'createdAt'> & { daysAgo: number }

function common(
  index: number,
  text: string,
  category: string,
  practiceCount: number,
  daysAgo: number,
  bookmarked = false,
): StoredQuestion {
  return {
    questionId: `mock-question-${String(index).padStart(2, '0')}`,
    text,
    origin: 'COMMON',
    category,
    companyName: null,
    practiceCount,
    bookmarked,
    daysAgo,
  }
}

function company(
  index: number,
  text: string,
  category: string,
  companyName: string,
  daysAgo: number,
  bookmarked = false,
): StoredQuestion {
  return {
    questionId: `mock-question-${String(index).padStart(2, '0')}`,
    text,
    origin: 'COMPANY',
    category,
    companyName,
    practiceCount: null,
    bookmarked,
    daysAgo,
  }
}

/** 최신순으로 적었습니다. `daysAgo` 는 오늘로부터 며칠 전에 생겼는지입니다 */
const questions: StoredQuestion[] = [
  common(1, '1분 자기소개를 해주세요.', '인성', 3, 0, true),
  company(2, '우리 회사에 지원한 이유는 무엇인가요?', '지원동기', '네이버', 1),
  common(3, '협업 중 갈등을 해결한 경험을 말해주세요.', '경험', 1, 2),
  common(4, '본인의 장점과 보완할 노력을 말해주세요.', '인성', 0, 3),
  company(5, '최근 관심 있게 본 기술 트렌드는 무엇인가요?', '직무', '카카오', 4),
  common(6, '가장 도전적이었던 프로젝트와 그 결과를 설명해 주세요.', '경험', 2, 5, true),
  company(7, '입사 후 3년 동안의 성장 계획을 말해주세요.', '지원동기', '삼성전자', 6),
  common(8, '실패했던 경험과 그 경험에서 배운 점을 말해주세요.', '경험', 0, 7),
  company(9, '우리 서비스에서 개선하고 싶은 점이 있다면 무엇인가요?', '직무', '네이버', 8, true),
  common(10, '팀에서 본인이 주로 맡는 역할은 무엇인가요?', '인성', 1, 9),
  common(11, '스트레스를 받을 때 어떻게 해소하나요?', '인성', 0, 10),
  company(12, '왜 다른 회사가 아니라 우리 회사인가요?', '지원동기', '카카오', 11),
  common(13, '마감이 촉박한 상황에서 우선순위를 어떻게 정하나요?', '경험', 2, 12),
  company(14, '지원 직무에서 가장 중요한 역량은 무엇이라고 생각하나요?', '직무', '삼성전자', 13),
  common(15, '리더로서 팀을 이끌었던 경험이 있나요?', '경험', 0, 14),
  common(16, '상사와 의견이 달랐을 때 어떻게 대처했나요?', '인성', 1, 15),
  company(17, '우리 회사의 최근 서비스 중 인상 깊었던 것은 무엇인가요?', '지원동기', '네이버', 17, true),
  common(18, '본인을 한 단어로 표현한다면 무엇인가요?', '인성', 0, 19),
  company(19, '지원 직무와 관련해 가장 자신 있는 기술 스택은 무엇인가요?', '직무', '카카오', 21),
  common(20, '새로운 기술을 빠르게 익혔던 경험을 말해주세요.', '경험', 1, 23),
  common(21, '입사 후 가장 먼저 하고 싶은 일은 무엇인가요?', '지원동기', 0, 26),
  company(22, '사용자 피드백을 서비스에 반영해 본 경험이 있나요?', '직무', '삼성전자', 29),
  common(23, '일과 삶의 균형에 대해 어떻게 생각하나요?', '인성', 0, 33),
  common(24, '동료의 실수를 발견했을 때 어떻게 하나요?', '인성', 2, 38, true),
  company(25, '우리 회사가 해결해야 할 가장 큰 문제는 무엇이라고 보나요?', '직무', '카카오', 44),
  common(26, '마지막으로 하고 싶은 말이 있나요?', '인성', 0, 50),
]

/** 오늘에서 `daysAgo` 일 전 오후 3시. 같은 날 여러 번 불러도 값이 같습니다 */
function createdAt(daysAgo: number): string {
  const date = new Date()
  date.setHours(15, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function toResponse({ daysAgo, ...stored }: StoredQuestion): QuestionResponse {
  return { ...stored, createdAt: createdAt(daysAgo) }
}

function parseInteger(value: string | null): number | null {
  if (value === null || value === '') return null
  const number = Number(value)
  if (!Number.isInteger(number)) throw new ApiError('INVALID_REQUEST', `숫자가 아닙니다 (${value})`)
  return number
}

function findQuestion(questionId: string) {
  const found = questions.find((stored) => stored.questionId === questionId)
  // TODO(백엔드): 없는 질문의 에러 코드는 백엔드가 정합니다. 지금은 임시로 `QUESTION_NOT_FOUND` 로 둡니다
  if (!found) throw new ApiError('QUESTION_NOT_FOUND', `질문을 찾을 수 없습니다 (${questionId})`)
  return found
}

const MISSING = '질문 은행 API 없음 — 질문 목록 · 북마크 컨트롤러가 백엔드에 없음 (경로 · 응답 모양 프론트 임시안)'

registerMock(
  'GET',
  '/api/questions',
  (_params, _body, query): QuestionListResponse => {
    const tab = query.get('tab') ?? 'ALL'
    const keyword = (query.get('keyword') ?? '').trim().toLowerCase()

    if (tab !== 'ALL' && tab !== 'COMMON' && tab !== 'BOOKMARKED') {
      throw new ApiError('INVALID_REQUEST', `알 수 없는 탭입니다 (${tab})`)
    }

    const pageParam = parseInteger(query.get('page'))
    const sizeParam = parseInteger(query.get('size'))
    // 문서 · 연습 기록 목록과 같은 보정입니다. 범위를 벗어나도 거절하지 않고 맞춥니다.
    const page = pageParam === null || pageParam < 0 ? 0 : pageParam
    const size = sizeParam === null || sizeParam < 1 ? DEFAULT_PAGE_SIZE : Math.min(sizeParam, MAX_PAGE_SIZE)

    const filtered = questions
      .filter((stored) => {
        if (tab === 'COMMON' && stored.origin !== 'COMMON') return false
        if (tab === 'BOOKMARKED' && !stored.bookmarked) return false
        return !keyword || stored.text.toLowerCase().includes(keyword)
      })
      .sort((a, b) => a.daysAgo - b.daysAgo)

    return {
      questions: filtered.slice(page * size, page * size + size).map(toResponse),
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    }
  },
  { missingInBackend: MISSING },
)

registerMock(
  'PUT',
  '/api/questions/:questionId/bookmark',
  ({ questionId }) => {
    findQuestion(questionId).bookmarked = true
  },
  { missingInBackend: MISSING },
)

registerMock(
  'DELETE',
  '/api/questions/:questionId/bookmark',
  ({ questionId }) => {
    findQuestion(questionId).bookmarked = false
  },
  { missingInBackend: MISSING },
)
