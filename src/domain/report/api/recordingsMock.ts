import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { InterviewRecordingsResponse } from './recordingsApi'
import { mockReportOfSession } from './reportMock'

/**
 * 면접 다시보기 재생목록 목업입니다. 백엔드 `InterviewRecordingsResponse`(#106) 모양 그대로입니다.
 *
 * 영상은 `public/mock/answer-sample.webm`(40초, 75KB) 한 개를 모든 문항에 씁니다. 실제 답변 영상처럼 WebM 입니다 — 목업 모드(main 배포 포함)에서도
 * 재생 화면을 볼 수 있게 짧고 가벼운 샘플을 뒀습니다. 녹음만 있는 문항도 같은 파일을 소리로 재생합니다.
 *
 * | 세션 | 경우 |
 * | --- | --- |
 * | 카메라를 안 쓴 회차(`…4e02`) | 시선을 안 써서 영상 없음 — `hasVideo: false`, 녹음만 |
 * | 말하기 · 시선 실패 회차(`…4e04`) | **처음 한 번은 만료된 주소**를 줍니다 — 재생 실패 → 다시 받기를 확인합니다 |
 * | 그 밖 | 문항 네 개 모두 영상 |
 */

const SAMPLE_URL = '/mock/answer-sample.webm'
/** 없는 파일이라 재생이 실패합니다. 만료된 서명 주소처럼 보이게 둡니다 */
const EXPIRED_URL = '/mock/expired-answer.webm'
const EXPIRES_ONCE_SESSION = '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e04'

/** 세션마다 몇 번 불렀는지. 만료 시나리오가 첫 번째에만 낡은 주소를 주는 데 씁니다 */
const calls = new Map<string, number>()

registerMock('GET', '/api/interviews/:sessionId/recordings', ({ sessionId }): InterviewRecordingsResponse => {
  if (sessionId === 'not-completed') {
    throw new ApiError('SESSION_NOT_COMPLETED', '아직 끝나지 않은 면접입니다')
  }

  const count = (calls.get(sessionId) ?? 0) + 1
  calls.set(sessionId, count)

  const report = mockReportOfSession(sessionId)
  const questions = report
    ? [...report.questions].sort((a, b) => a.questionNumber - b.questionNumber)
    : [1, 2, 3, 4].map((questionNumber) => ({ questionId: `q${questionNumber}`, questionNumber, questionText: null }))
  // 시선을 안 쓴 회차는 카메라를 끈 면접입니다
  const withVideo = report?.axes.gaze?.status !== 'skipped'
  const base = sessionId === EXPIRES_ONCE_SESSION && count === 1 ? EXPIRED_URL : SAMPLE_URL
  // 실제 서버처럼 문항마다 주소가 다르게 합니다(같은 파일이어도). 문항을 바꾸면 새 요소로 불러옵니다
  const urlOf = (questionId: string) => `${base}?q=${encodeURIComponent(questionId)}`

  const items = questions.map((question) => ({
    questionId: question.questionId,
    questionNumber: question.questionNumber,
    type: 'QUESTION',
    questionText: question.questionText,
    questionAudioUrl: null,
    answerAudioUrl: urlOf(question.questionId),
    answerVideoUrl: withVideo ? urlOf(question.questionId) : null,
  }))

  return { sessionId, hasVideo: items.some((item) => item.answerVideoUrl !== null), items }
})
