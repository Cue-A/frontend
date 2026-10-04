import type { ErrorPush, ProgressPush, Question, SessionEndPush } from '../types/interview'

export type SessionSocketHandlers = {
  onQuestion: (question: Question) => void
  onProgress: (progress: ProgressPush) => void
  onError: (error: ErrorPush) => void
  onSessionEnd: (sessionEnd: SessionEndPush) => void
}

/**
 * 문항 수. 주질문 2개 + 꼬리질문 1개다. 되묻기(REASK)는 세지 않는다.
 * 실제 서버의 `questionTotal` 은 3 · 6 · 9 중 하나라 그중 가장 작은 값에 맞췄다.
 */
const TOTAL_QUESTIONS = 3

type Turn = {
  question: Question
  progressStages: ProgressPush['stage'][]
}

function buildQuestion(
  overrides: Pick<Question, 'questionId' | 'questionType' | 'questionNumber' | 'text'> & Partial<Question>,
): Question {
  return {
    audioUrl: 'https://example.com/mock-tts.mp3',
    audioAvailable: true,
    category: '프로젝트경험',
    difficulty: 'L2',
    questionTotal: TOTAL_QUESTIONS,
    ...overrides,
  }
}

/**
 * 실제 WS 메시지 스키마(question/progress/error/session_end)를 그대로 흉내내는 4턴
 * 시나리오입니다. QUESTION 2개 중 1번엔 REASK(STT 실패 재시도), 2번엔 FOLLOWUP이
 * 붙는다. advanceTurn() 이 매번 progress 스테이지들을 흘려보낸 뒤 다음 질문 또는
 * session_end 를 내보낸다.
 *
 * `questionNumber` 는 백엔드 계약을 따른다 (Cue-A/backend docs/10-ai-client.md "응답 타입").
 * 주질문 · 꼬리질문은 번호가 올라가고, 되묻기만 올라가지 않는다. 그래서 진행률이
 * 1/3 → 1/3(되묻기) → 2/3 → 3/3(꼬리질문) 으로 보인다. 전에는 꼬리질문이 앞 질문과 같은
 * 번호(2)를 써서 "질문 2 / 2" 에 머물렀다. (이슈 #99)
 */
const TURNS: Turn[] = [
  {
    question: buildQuestion({
      questionId: 'mock-q1',
      questionType: 'QUESTION',
      questionNumber: 1,
      text: '포트폴리오에 랜덤 포레스트를 쓰셨네요. 왜 이 모델을 선택하셨나요?',
    }),
    progressStages: ['TRANSCRIBING', 'GENERATING'],
  },
  {
    // STT_FAILED 로 인한 재질문. 서버가 questionNumber 를 올리지 않고 그대로 보낸다.
    question: buildQuestion({
      questionId: 'mock-q1-reask',
      questionType: 'REASK',
      questionNumber: 1,
      text: '죄송하지만 답변이 잘 들리지 않았어요. 다시 한 번 말씀해 주시겠어요?',
      category: null,
      difficulty: null,
      audioUrl: null,
      audioAvailable: false,
    }),
    progressStages: ['TRANSCRIBING', 'GENERATING'],
  },
  {
    question: buildQuestion({
      questionId: 'mock-q2',
      questionType: 'QUESTION',
      questionNumber: 2,
      text: '가장 어려웠던 협업 경험은 무엇이었나요?',
    }),
    progressStages: ['TRANSCRIBING', 'GENERATING', 'SYNTHESIZING'],
  },
  {
    question: buildQuestion({
      questionId: 'mock-q2-followup',
      questionType: 'FOLLOWUP',
      // 꼬리질문도 한 문항으로 센다. 앞 질문(2) 다음 번호다.
      questionNumber: 3,
      text: '방금 답변에서 언급한 갈등 상황을 조금 더 구체적으로 설명해 주시겠어요?',
    }),
    progressStages: ['TRANSCRIBING', 'GENERATING'],
  },
]

type MockSession = {
  handlers: SessionSocketHandlers
  turnIndex: number
  timeoutIds: ReturnType<typeof setTimeout>[]
}

const sessions = new Map<string, MockSession>()

function schedule(session: MockSession, run: () => void, delayMs: number) {
  const id = setTimeout(run, delayMs)
  session.timeoutIds.push(id)
}

export function connectMockSessionSocket(sessionId: string, handlers: SessionSocketHandlers): () => void {
  const session: MockSession = { handlers, turnIndex: 0, timeoutIds: [] }
  sessions.set(sessionId, session)

  schedule(session, () => handlers.onQuestion(TURNS[0].question), 400)

  return () => {
    session.timeoutIds.forEach(clearTimeout)
    sessions.delete(sessionId)
  }
}

/**
 * 답변 제출 mock(POST /api/interviews/:sessionId/answers)이 호출한다.
 * 현재 턴의 progress 스테이지를 흘려보낸 뒤 다음 질문(또는 마지막이면 session_end)을 내보낸다.
 */
export function advanceMockSession(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return

  const { handlers, turnIndex } = session
  const { progressStages } = TURNS[turnIndex]

  let delay = 500
  for (const stage of progressStages) {
    schedule(session, () => handlers.onProgress({ stage }), delay)
    delay += 700
  }

  schedule(
    session,
    () => {
      session.turnIndex += 1
      if (session.turnIndex < TURNS.length) {
        handlers.onQuestion(TURNS[session.turnIndex].question)
      } else {
        handlers.onSessionEnd({ sessionId, totalQuestions: TOTAL_QUESTIONS })
      }
    },
    delay,
  )
}
