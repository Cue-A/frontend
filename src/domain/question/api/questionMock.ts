import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { MAX_QUESTION_LENGTH, QUESTION_CATEGORIES } from '../lib/questionDisplay'

import type {
  BookmarkListResponse,
  BookmarkResponse,
  CommonFavoriteResponse,
  CommonQuestionListResponse,
  CommonQuestionRequest,
  CommonQuestionResponse,
} from './questionResponse'

/**
 * 질문 은행 목업입니다. 저장은 메모리에만 해서 새로고침하면 처음으로 돌아갑니다.
 *
 * ── 백엔드 연결 상태 ────────────────────────────────────────────────────────
 * 북마크(`/api/bookmarks`): 백엔드에 들어왔습니다(Cue-A/backend#118, 2026-11-04 dev 머지). 그래서 `missingInBackend`
 * 표시가 없고, **`VITE_REAL_APIS` 에 `bookmarks` 를 넣으면 실제 서버로 갑니다**. 안 넣으면 이 목업이 답합니다.
 * 이 목업은 백엔드 동작을 따라 만들었습니다 — 되묻기는 `originalQuestionText` 가 되물은 질문, 꼬리질문은 그 토픽의
 * 주질문, 되묻기는 분류 · 난이도가 null, 메모는 공백뿐이면 지움.
 * 공통 질문(`/api/common-questions`): 백엔드에 없습니다. 내 질문 추가 · 수정 · 삭제(`POST` · `PATCH` · `DELETE`)도 같은
 * 임시안입니다(`custom: true` 인 질문만 고치고 지울 수 있음). 명세가 정해지면
 * 1. `questionResponse.ts` 의 응답 타입과 변환 함수, `questionApi.ts` 의 경로를 고칩니다
 * 2. 아래 `registerMock` 의 `{ missingInBackend: MISSING_COMMON }` 을 지웁니다
 * 3. 북마크도 실서버로 확인이 끝나면 이 파일을 통째로 지우고, `questionApi.ts` 맨 위의 `import './questionMock'` 도
 *    같이 지웁니다
 * ────────────────────────────────────────────────────────────────────────────
 *
 * 북마크 여섯 줄 중 다섯은 시안의 문장입니다. 날짜는 홈 · 연습 기록 목업처럼 **오늘 기준**으로 만듭니다.
 */

const MISSING_COMMON = '공통 질문 API 없음 — 경로 · 응답 모양 프론트 임시안'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const MAX_MEMO_LENGTH = 500

type StoredBookmark = Omit<BookmarkResponse, 'bookmarkedAt'> & { daysAgo: number }

function bookmark(
  index: number,
  daysAgo: number,
  fields: Pick<StoredBookmark, 'type' | 'questionText' | 'category' | 'originalQuestionText' | 'memo' | 'companyName'>,
): StoredBookmark {
  return {
    sessionId: `mock-session-${index}`,
    questionId: `mock-q-${index}`,
    difficulty: fields.category === null ? null : 'L2',
    jobRole: '백엔드 개발자',
    daysAgo,
    ...fields,
  }
}

/** 담은 순서의 최신순으로 적었습니다 */
const bookmarks: StoredBookmark[] = [
  bookmark(1, 1, {
    type: 'QUESTION',
    questionText: '1분 자기소개를 해주세요.',
    category: '인성',
    originalQuestionText: null,
    memo: 'STAR 구조로 다시 정리하기',
    companyName: null,
  }),
  bookmark(2, 2, {
    type: 'QUESTION',
    questionText: '우리 회사에 지원한 이유는 무엇인가요?',
    category: '지원동기',
    originalQuestionText: null,
    memo: null,
    companyName: '네이버',
  }),
  bookmark(3, 3, {
    type: 'FOLLOWUP',
    questionText: '캐시와 DB 사이의 데이터 정합성은 어떻게 맞췄나요?',
    category: '직무',
    originalQuestionText: 'Redis를 캐시로 도입한 이유는 무엇인가요?',
    memo: 'Cache-Aside + TTL\n쓰기 시 DB 먼저 갱신 → 캐시 삭제 순서로 설명하기',
    companyName: '네이버',
  }),
  bookmark(4, 4, {
    type: 'FOLLOWUP',
    questionText: '그때 본인의 판단이 틀렸다면 어떻게 했을 것 같나요?',
    category: '경험',
    originalQuestionText: '협업 중 갈등을 해결한 경험을 말해주세요.',
    memo: null,
    companyName: null,
  }),
  bookmark(5, 6, {
    type: 'REASK',
    questionText: '방금 말씀하신 성과를 수치로 다시 설명해 주시겠어요?',
    category: null,
    originalQuestionText: '가장 기억에 남는 프로젝트 경험을 말해주세요.',
    memo: null,
    companyName: '카카오모빌리티',
  }),
  bookmark(6, 8, {
    type: 'QUESTION',
    questionText: '최근 관심 있게 본 기술 트렌드는 무엇인가요?',
    category: '직무',
    originalQuestionText: null,
    memo: null,
    companyName: '카카오모빌리티',
  }),
]

/** 오늘에서 `daysAgo` 일 전 오후 3시. 같은 날 여러 번 불러도 값이 같습니다 */
function bookmarkedAt(daysAgo: number): string {
  const date = new Date()
  date.setHours(15, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function toResponse({ daysAgo, ...stored }: StoredBookmark): BookmarkResponse {
  return { ...stored, bookmarkedAt: bookmarkedAt(daysAgo) }
}

/** 숫자가 아니면 400. 범위를 벗어나면 거절하지 않고 맞춥니다 (명세) */
function parseInteger(value: string | null): number | null {
  if (value === null || value === '') return null
  const number = Number(value)
  if (!Number.isInteger(number)) throw new ApiError('INVALID_REQUEST', `숫자가 아닙니다 (${value})`)
  return number
}

function findBookmark(sessionId: string, questionId: string) {
  const found = bookmarks.find((stored) => stored.sessionId === sessionId && stored.questionId === questionId)
  if (!found) throw new ApiError('BOOKMARK_NOT_FOUND', `질문은행에 없는 질문입니다 (${sessionId}/${questionId})`)
  return found
}

registerMock(
  'GET',
  '/api/bookmarks',
  (_params, _body, query): BookmarkListResponse => {
    const pageParam = parseInteger(query.get('page'))
    const sizeParam = parseInteger(query.get('size'))
    const page = pageParam === null || pageParam < 0 ? 0 : pageParam
    const size = sizeParam === null || sizeParam < 1 ? DEFAULT_PAGE_SIZE : Math.min(sizeParam, MAX_PAGE_SIZE)

    const sorted = [...bookmarks].sort((a, b) => a.daysAgo - b.daysAgo)

    return {
      bookmarks: sorted.slice(page * size, page * size + size).map(toResponse),
      page,
      size,
      totalElements: sorted.length,
      totalPages: Math.ceil(sorted.length / size),
    }
  },
)

registerMock(
  'PATCH',
  '/api/bookmarks/:sessionId/:questionId',
  ({ sessionId, questionId }, body) => {
    const found = findBookmark(sessionId, questionId)
    const memo = (body as { memo?: unknown } | undefined)?.memo ?? null

    if (memo !== null && typeof memo !== 'string') throw new ApiError('INVALID_REQUEST', 'memo 는 문자열이어야 합니다')
    if (typeof memo === 'string' && memo.length > MAX_MEMO_LENGTH) {
      throw new ApiError('INVALID_REQUEST', `memo 는 ${MAX_MEMO_LENGTH}자까지입니다`)
    }

    // 없음 · 빈 문자열 · 공백뿐이면 메모를 지웁니다
    found.memo = memo !== null && memo.trim() !== '' ? memo : null
    return { memo: found.memo }
  },
)

registerMock(
  'DELETE',
  '/api/bookmarks/:sessionId/:questionId',
  ({ sessionId, questionId }) => {
    const found = findBookmark(sessionId, questionId)
    bookmarks.splice(bookmarks.indexOf(found), 1)
  },
)

/** 공통 질문. 저장은 메모리에만 합니다 */
const commonQuestions: CommonQuestionResponse[] = [
  ['1분 자기소개를 해주세요.', '인성'],
  ['본인의 장점과 보완할 노력을 말해주세요.', '인성'],
  ['협업 중 갈등을 해결한 경험을 말해주세요.', '경험'],
  ['가장 도전적이었던 프로젝트와 그 결과를 설명해 주세요.', '경험'],
  ['실패했던 경험과 그 경험에서 배운 점을 말해주세요.', '경험'],
  ['팀에서 본인이 주로 맡는 역할은 무엇인가요?', '인성'],
  ['스트레스를 받을 때 어떻게 해소하나요?', '인성'],
  ['마감이 촉박한 상황에서 우선순위를 어떻게 정하나요?', '경험'],
  ['리더로서 팀을 이끌었던 경험이 있나요?', '경험'],
  ['상사와 의견이 달랐을 때 어떻게 대처했나요?', '인성'],
  ['입사 후 3년 동안의 성장 계획을 말해주세요.', '지원동기'],
  ['새로운 기술을 빠르게 익혔던 경험을 말해주세요.', '경험'],
].map(([text, category], index) => ({
  questionId: `mock-common-${String(index + 1).padStart(2, '0')}`,
  text,
  category,
  favorite: false,
  favoritedAt: null,
  memo: null,
  custom: false,
}))

function findCommon(questionId: string) {
  const found = commonQuestions.find((question) => question.questionId === questionId)
  // 백엔드에 없는 API 라 에러 코드가 없습니다. 이미 매핑돼 있는 코드를 임시로 씁니다
  if (!found) throw new ApiError('QUESTION_NOT_FOUND', `질문을 찾을 수 없습니다 (${questionId})`)
  return found
}

registerMock(
  'GET',
  '/api/common-questions',
  (): CommonQuestionListResponse => ({ questions: commonQuestions.map((question) => ({ ...question })) }),
  { missingInBackend: MISSING_COMMON },
)

registerMock(
  'PUT',
  '/api/common-questions/:questionId/favorite',
  ({ questionId }, body): CommonFavoriteResponse => {
    const found = findCommon(questionId)
    const favorite = (body as { favorite?: unknown } | undefined)?.favorite
    if (typeof favorite !== 'boolean') throw new ApiError('INVALID_REQUEST', 'favorite 는 true · false 여야 합니다')

    // 이미 그 상태면 아무것도 바꾸지 않습니다
    if (found.favorite !== favorite) {
      found.favorite = favorite
      found.favoritedAt = favorite ? new Date().toISOString() : null
    }
    return { favorite: found.favorite }
  },
  { missingInBackend: MISSING_COMMON },
)

registerMock(
  'PATCH',
  '/api/common-questions/:questionId/memo',
  ({ questionId }, body) => {
    const found = findCommon(questionId)
    const memo = (body as { memo?: unknown } | undefined)?.memo ?? null

    if (memo !== null && typeof memo !== 'string') throw new ApiError('INVALID_REQUEST', 'memo 는 문자열이어야 합니다')
    if (typeof memo === 'string' && memo.length > MAX_MEMO_LENGTH) {
      throw new ApiError('INVALID_REQUEST', `memo 는 ${MAX_MEMO_LENGTH}자까지입니다`)
    }

    found.memo = memo !== null && memo.trim() !== '' ? memo : null
    return { memo: found.memo }
  },
  { missingInBackend: MISSING_COMMON },
)

/** 본문을 검사해 `{ text, category }` 로 돌려줍니다. 서버 검증을 흉내 냅니다 */
function parseQuestionRequest(body: unknown): CommonQuestionRequest {
  const { text, category } = (body ?? {}) as Partial<Record<keyof CommonQuestionRequest, unknown>>

  if (typeof text !== 'string' || text.trim() === '') throw new ApiError('INVALID_REQUEST', 'text 는 비어 있을 수 없습니다')
  if (text.trim().length > MAX_QUESTION_LENGTH) {
    throw new ApiError('INVALID_REQUEST', `text 는 ${MAX_QUESTION_LENGTH}자까지입니다`)
  }
  if (typeof category !== 'string' || !(QUESTION_CATEGORIES as readonly string[]).includes(category)) {
    throw new ApiError('INVALID_REQUEST', `category 는 ${QUESTION_CATEGORIES.join(' · ')} 중 하나여야 합니다`)
  }

  return { text: text.trim(), category }
}

/** 내 질문은 100개까지입니다. 넘으면 409 `CUSTOM_QUESTION_LIMIT_EXCEEDED` */
const MAX_CUSTOM_QUESTIONS = 100

let nextCustomId = 1

registerMock(
  'POST',
  '/api/common-questions',
  (_params, body): CommonQuestionResponse => {
    const { text, category } = parseQuestionRequest(body)
    if (commonQuestions.filter((question) => question.custom).length >= MAX_CUSTOM_QUESTIONS) {
      throw new ApiError('CUSTOM_QUESTION_LIMIT_EXCEEDED', `내 질문은 ${MAX_CUSTOM_QUESTIONS}개까지입니다`)
    }
    const created: CommonQuestionResponse = {
      questionId: `mock-custom-${nextCustomId++}`,
      text,
      category,
      favorite: false,
      favoritedAt: null,
      memo: null,
      custom: true,
    }
    // 내가 추가한 질문은 기본 질문보다 앞에 둡니다 (가장 최근 것이 맨 위)
    commonQuestions.unshift(created)
    return { ...created }
  },
  { missingInBackend: MISSING_COMMON },
)

registerMock(
  'PATCH',
  '/api/common-questions/:questionId',
  ({ questionId }, body): CommonQuestionResponse => {
    const found = findCommon(questionId)
    // 백엔드에 없는 API 라 에러 코드가 없습니다. 이미 매핑돼 있는 코드를 임시로 씁니다
    if (!found.custom) throw new ApiError('FORBIDDEN', '기본 질문은 고칠 수 없습니다')

    Object.assign(found, parseQuestionRequest(body))
    return { ...found }
  },
  { missingInBackend: MISSING_COMMON },
)

registerMock(
  'DELETE',
  '/api/common-questions/:questionId',
  ({ questionId }) => {
    const found = findCommon(questionId)
    if (!found.custom) throw new ApiError('FORBIDDEN', '기본 질문은 지울 수 없습니다')

    commonQuestions.splice(commonQuestions.indexOf(found), 1)
  },
  { missingInBackend: MISSING_COMMON },
)
