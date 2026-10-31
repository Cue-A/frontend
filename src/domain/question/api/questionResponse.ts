import type { Question, QuestionPage } from '../types/question'

/**
 * 질문 은행 서버 응답 모양입니다. **백엔드에 아직 없는 API 라 프론트가 정한 임시안입니다.** (이슈 #138)
 *
 * 백엔드에는 `question` · `bookmarked_question` 테이블(ERD)만 있고 컨트롤러가 없습니다. 이 모양을 백엔드에 요청하고,
 * 바뀌면 **이 파일과 변환 함수, 목업(`questionMock.ts`)만** 고칩니다. 화면은 `types/question.ts` 만 봅니다.
 *
 * ERD 와 어긋나서 백엔드에 같이 적어 보낼 것
 * - TODO(백엔드): 기본 공통 질문을 담는 테이블이 ERD 에 없습니다. `question` 은 면접 세션에 속합니다
 * - TODO(백엔드): `bookmarked_question` 이 `(question_id, session_id)` 로 질문을 가리킵니다. 이 계약은 `questionId`
 *   하나로 가정했습니다 (공통 질문에는 세션이 없습니다)
 * - TODO(백엔드): `question.is_bookmarked` 와 `bookmarked_question` 이 둘 다 있습니다. 어느 쪽이 기준인지
 * - TODO(백엔드): `companyName` 은 `session → company` 를 거쳐야 하고, `practiceCount` 에 해당하는 값은 ERD 에 없습니다
 * - TODO(백엔드): `category` 는 화면에 그대로 보여 줄 한글 이름으로 가정했습니다. `question.category` 가 코드
 *   값(PERSONALITY 등)이면 이 파일에 이름표(변환표)를 더해야 합니다
 * - TODO(백엔드): 목록은 **본 질문만** 내려줘야 합니다. 꼬리질문 · 재질문(`question.type` · `is_replay`)은
 *   서버가 걸러 주세요. 화면은 거르지 않습니다
 */

/** `GET /api/questions` 목록 한 줄 */
export type QuestionResponse = {
  questionId: string
  text: string
  origin: 'COMMON' | 'COMPANY'
  category: string
  /** 공통 질문이면 null */
  companyName: string | null
  /** 모르면 null */
  practiceCount: number | null
  bookmarked: boolean
  createdAt: string
}

export type QuestionListResponse = {
  questions: QuestionResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export function toQuestion(response: QuestionResponse): Question {
  return {
    questionId: response.questionId,
    text: response.text,
    origin: response.origin,
    category: response.category,
    companyName: response.companyName,
    practiceCount: response.practiceCount,
    bookmarked: response.bookmarked,
    createdAt: response.createdAt,
  }
}

export function toQuestionPage(response: QuestionListResponse): QuestionPage {
  return {
    questions: response.questions.map(toQuestion),
    page: response.page,
    size: response.size,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  }
}
