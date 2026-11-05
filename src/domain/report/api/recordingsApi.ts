import { api } from '@/shared/api/apiClient'

import type { AnswerRecording, InterviewRecordings, RecordingKind } from '../types/recording'

import './recordingsMock'

/** 서버 응답 모양입니다. (Cue-A/backend#106 `InterviewRecordingsResponse`) */
export type InterviewRecordingsResponse = {
  sessionId: string
  hasVideo: boolean
  items: {
    questionId: string
    questionNumber: number
    /** `QUESTION` · `FOLLOWUP` · `REASK` */
    type: string
    questionText: string | null
    /** 면접관 질문 음성. 리포트 화면은 쓰지 않습니다 */
    questionAudioUrl: string | null
    answerAudioUrl: string | null
    answerVideoUrl: string | null
  }[]
}

function kindOf(type: string): RecordingKind {
  if (type === 'REASK') return 'reask'
  if (type === 'FOLLOWUP') return 'followup'
  return 'question'
}

export function toInterviewRecordings(response: InterviewRecordingsResponse): InterviewRecordings {
  const items: AnswerRecording[] = (response.items ?? []).map((item) => ({
    questionId: item.questionId,
    questionNumber: item.questionNumber,
    kind: kindOf(item.type),
    questionText: item.questionText?.trim() ? item.questionText : null,
    audioUrl: item.answerAudioUrl || null,
    videoUrl: item.answerVideoUrl || null,
  }))
  return { hasVideo: items.some((item) => item.videoUrl !== null), items }
}

/**
 * 면접 다시보기 재생목록. `GET /api/interviews/{sessionId}/recordings` (1분에 60번)
 *
 * 면접 세션의 하위 자원이라 `VITE_REAL_APIS` 의 **`interviews`** 도메인입니다.
 *
 *   SESSION_NOT_FOUND      없는 세션 · 남의 세션 (404)
 *   SESSION_NOT_COMPLETED  아직 끝나지 않은 면접 (409)
 *   SESSION_ABORTED        중단된 면접 (409)
 *
 * 재생 주소는 부를 때마다 새로 서명되고 1시간 뒤 만료됩니다. 파일은 지우지 않아서 다시 부르면 새 주소를 받습니다.
 * `hasVideo` 는 받은 문항으로 다시 셉니다 — 서버도 같은 규칙(영상이 하나라도 있으면 true)이라 값이 같습니다.
 */
export async function getInterviewRecordings(sessionId: string) {
  const response = await api.get<InterviewRecordingsResponse>(
    `/api/interviews/${encodeURIComponent(sessionId)}/recordings`,
  )
  return toInterviewRecordings(response)
}
