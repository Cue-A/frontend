/**
 * 면접 다시보기 재생목록입니다. (`GET /api/interviews/{sessionId}/recordings`, Cue-A/backend#106 · 이슈 #168)
 *
 * 면접 전체를 담은 영상 파일은 없습니다. 답변 영상이 문항마다 나뉘어 있어 화면이 문항을 골라 재생합니다.
 * 재생 주소는 요청할 때마다 새로 서명되고 **1시간 뒤 만료됩니다.** 재생이 실패하면 목록을 다시 받아 새 주소로 이어 봅니다.
 */

/** 문항 종류. 되묻기(`reask`)는 원 질문과 같은 번호이고 바로 뒤에 옵니다 */
export type RecordingKind = 'question' | 'followup' | 'reask'

export type AnswerRecording = {
  /** 세션 안에서만 유일한 질문 id. 되묻기는 `q_1r` 처럼 따로 있습니다 */
  questionId: string
  questionNumber: number
  kind: RecordingKind
  /** 질문을 숨긴 면접이어도 옵니다. 없으면 null */
  questionText: string | null
  /** 답변 녹음. 서명에 실패하면 null */
  audioUrl: string | null
  /** 답변 영상. 그 문항에서 카메라를 쓰지 않았으면 null */
  videoUrl: string | null
}

export type InterviewRecordings = {
  /** 답변 영상이 하나라도 있는지. 카메라를 한 번도 안 썼으면 false 입니다 */
  hasVideo: boolean
  /** 나간 순서대로입니다 */
  items: AnswerRecording[]
}

/** 다른 칸(XAI 타임라인)이 답변 영상에 "이 문항의 이 시각부터 보여줘" 라고 부탁할 때의 내용입니다 */
export type SeekRequest = {
  /** 요청을 보낸 리포트. 다른 리포트로 옮기면 이전 요청을 버립니다 */
  reportId: string
  questionId: string
  /** 그 답변의 녹음 · 영상 기준 초 */
  seconds: number
  /** 같은 자리를 다시 눌러도 새 요청으로 보도록 매번 바꿉니다 */
  key: number
}
