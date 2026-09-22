import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { isAllowedAudioRecordingType, isAllowedVideoRecordingType } from '../lib/validateAnswerRecording'
import type { AnswerUploadUrlsRequest, AnswerUploadUrlsResponse } from '../types/media'

/**
 * // TODO(#54 확인 필요): objectKey 뒤쪽 이름 규칙이 아직 확정되지 않았다(이슈 원문에
 * 정확한 값이 없음). 여기 값은 mock 이 그럴듯한 응답을 만들기 위해 임의로 지어낸
 * 것으로, 실제 백엔드 `ObjectKeys` 규칙과 다를 수 있다. `mediaApi.ts`/
 * `useAnswerRecording.ts` 는 이 값을 그대로 신뢰해서 쓸 뿐 스스로 objectKey 형식을
 * 조합하지 않는다 — 실제 규칙이 확정되면 이 mock 함수만 고치면 된다.
 */
function buildAnswerObjectKey(sessionId: string, questionId: string, kind: 'audio' | 'video') {
  return `sessions/${sessionId}/answers/${questionId}/${kind}`
}

registerMock('POST', '/api/interviews/:sessionId/answers/upload-urls', ({ sessionId }, body) => {
  const request = body as AnswerUploadUrlsRequest

  // 실제 FileValidator 도 발급 시점에 mimeType 을 본다. 프론트 검증을 우회해도
  // (예: 다른 클라이언트로 직접 호출) mock 도 똑같이 막는다.
  if (!isAllowedAudioRecordingType(request.audioMimeType)) {
    throw new ApiError('UNSUPPORTED_FILE_FORMAT', `지원하지 않는 오디오 형식이에요. (${request.audioMimeType})`)
  }
  if (request.videoMimeType && !isAllowedVideoRecordingType(request.videoMimeType)) {
    throw new ApiError('UNSUPPORTED_FILE_FORMAT', `지원하지 않는 영상 형식이에요. (${request.videoMimeType})`)
  }

  const audioObjectKey = buildAnswerObjectKey(sessionId, request.questionId, 'audio')

  const response: AnswerUploadUrlsResponse = {
    audioObjectKey,
    // 실제 스토리지 주소가 아니다 — mediaApi.uploadToPresignedUrl 이 mock 모드에서는
    // 이 주소로 fetch 하지 않고 바로 성공으로 취급한다.
    audioUploadUrl: `mock://media-upload/${encodeURIComponent(audioObjectKey)}`,
  }

  // 카메라가 없어 videoFileName 을 안 보낸 요청이면 video 쪽 응답도 만들지 않는다.
  if (request.videoFileName) {
    const videoObjectKey = buildAnswerObjectKey(sessionId, request.questionId, 'video')
    response.videoObjectKey = videoObjectKey
    response.videoUploadUrl = `mock://media-upload/${encodeURIComponent(videoObjectKey)}`
  }

  return response
})
