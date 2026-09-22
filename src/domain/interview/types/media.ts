/**
 * 면접 진행 화면(B-01-3)의 카메라·마이크 스트림 상태입니다.
 *
 * `types/deviceCheck.ts` 의 `DeviceCheckState` 와 비슷하지만 일부러 같이 쓰지 않는다 —
 * 그건 장치 테스트 화면(세션 진입 전, 1회성 점검)용이고, 여기는 세션 내내 살아있는
 * 스트림이라 장치가 점검 통과 후에도 중간에 끊길 수 있다("트랙 중단"). 그 경우가
 * `device-ended` 인데, 장치 테스트 화면에는 있을 수 없는 상태라 그쪽 타입을
 * 넓히지 않는다.
 */
export type MediaTrackFailureReason = 'permission-denied' | 'not-found' | 'device-ended' | 'unknown'

export type MediaTrackState = {
  status: 'unchecked' | 'available' | 'failed'
  failureReason: MediaTrackFailureReason | null
}

/**
 * 답변 녹화 업로드 계약입니다 (이슈 #54, `feat/24-interview-answer-flow` 기준으로
 * 확인됨 — 추측이 아니라 백엔드 코드로 확인된 값이다).
 *
 * 오디오는 필수, 영상은 카메라가 있을 때만 선택적으로 같이 올린다. presigned URL 은
 * 한 번의 요청으로 오디오·영상 것을 같이 받고 각각 PUT 한다. 별도의 "업로드 완료"
 * 엔드포인트는 없다 — `sessionApi.submitAnswer` 가 호출하는
 * `POST /api/interviews/{sessionId}/answers` 자체가 완료 통보를 겸한다.
 *
 * MediaRecorder 가 오디오만 녹음해도 `video/webm` 을 뱉는 브라우저가 흔하다 — 그대로
 * `audioMimeType` 에 넣으면 백엔드가 `UNSUPPORTED_FILE_FORMAT` 으로 거절한다. 트랙
 * 구성에 맞는 실제 mimeType 을 구분해서 넣어야 한다(`useAnswerRecording.ts` 참고).
 */
export type AnswerUploadUrlsRequest = {
  questionId: string
  audioFileName: string
  audioMimeType: string
  audioSize: number
  videoFileName?: string
  videoMimeType?: string
  videoSize?: number
}

/**
 * videoObjectKey/videoUploadUrl 은 이슈 원문엔 `?` 표시가 없지만, 요청 쪽 video 필드가
 * 전부 optional 인 것과 짝을 맞춰 "video 를 안 보내면 안 온다"고 가정했다 — 실제로
 * 항상 오는 것으로 확인되면 이 타입만 고치면 된다.
 */
export type AnswerUploadUrlsResponse = {
  audioObjectKey: string
  audioUploadUrl: string
  videoObjectKey?: string
  videoUploadUrl?: string
}

/**
 * 답변 녹화 업로드 상태입니다. `useInterviewSession` 의 `phase`(텍스트 답변 제출)와는
 * 별개로 추적하되, `InterviewPage.tsx` 가 이 상태의 `'uploaded'` 전이를 보고서야
 * 실제 제출(`session.submitAnswer`)을 부른다 —
 * // DECISION NEEDED(#54 "확정 안 된 것" 3번): 텍스트 제출과 녹화 업로드를 하나의
 * 트랙으로 합칠지 아직 팀 확인 전이다. 지금은 "업로드가 끝나야 제출 가능"한 안전한
 * 쪽으로 임시로 연결해뒀다 — `InterviewPage.tsx` 의 해당 effect 주석 참고.
 */
export type RecordingUploadStatus =
  | { status: 'idle' }
  | { status: 'recording' }
  | { status: 'uploading' }
  | { status: 'uploaded'; audioObjectKey: string; videoObjectKey: string | null }
  | { status: 'failed'; message: string }
