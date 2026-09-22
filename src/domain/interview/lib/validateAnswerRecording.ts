/**
 * 답변 녹화 파일 검증입니다. (백엔드 FileValidator 와 같은 계약, 이슈 #25 · #54)
 *
 * 오디오·영상을 별개 파일로 올리기 때문에 허용 mimeType 목록도 따로 둔다 — 영상
 * 목록으로 오디오 파일을 검사하면(또는 그 반대) 실제로 올릴 수 있는 파일도
 * `UNSUPPORTED_FILE_FORMAT` 으로 잘못 막히게 된다.
 *
 * presigned URL 을 받기 전에 미리 걸러서, 파일을 다 올려놓고 서버 거절을 뒤늦게
 * 아는 일을 줄인다. presigned-url 요청엔 mimeType 만 실려 가고(크기는 `*Size` 로
 * 따로 실린다) mock 의 presigned-url 핸들러도 mimeType 만 같은 규칙으로 본다.
 */
export const ALLOWED_AUDIO_RECORDING_TYPES = ['audio/webm', 'audio/mp4'] as const
export const ALLOWED_VIDEO_RECORDING_TYPES = ['video/webm', 'video/mp4'] as const

/** 임시 값입니다. 백엔드 FileValidator 의 실제 상한이 확인되면 이 값만 바꾸면 됩니다. */
export const MAX_RECORDING_BYTES = 50 * 1024 * 1024

function baseType(contentType: string) {
  return contentType.split(';')[0]?.trim() ?? ''
}

export function isAllowedAudioRecordingType(contentType: string): boolean {
  return ALLOWED_AUDIO_RECORDING_TYPES.includes(baseType(contentType) as (typeof ALLOWED_AUDIO_RECORDING_TYPES)[number])
}

export function isAllowedVideoRecordingType(contentType: string): boolean {
  return ALLOWED_VIDEO_RECORDING_TYPES.includes(baseType(contentType) as (typeof ALLOWED_VIDEO_RECORDING_TYPES)[number])
}

/**
 * 녹화된 파일 하나(오디오 또는 영상)가 올릴 수 있는지 봅니다.
 * 쓸 수 있으면 `null`, 아니면 화면에 그대로 보여줄 문구를 돌려줍니다.
 */
export function validateAnswerRecording(kind: 'audio' | 'video', blob: Blob): string | null {
  const isAllowed = kind === 'audio' ? isAllowedAudioRecordingType(blob.type) : isAllowedVideoRecordingType(blob.type)
  const kindLabel = kind === 'audio' ? '오디오' : '영상'

  if (!isAllowed) {
    return `지원하지 않는 ${kindLabel} 형식이에요. (${blob.type || '알 수 없음'})`
  }

  if (blob.size === 0) {
    return kind === 'audio' ? '녹음된 내용이 없어요.' : '녹화된 내용이 없어요.'
  }

  if (blob.size > MAX_RECORDING_BYTES) {
    const limitMb = Math.round(MAX_RECORDING_BYTES / (1024 * 1024))
    return `${kindLabel} 파일이 너무 커요. ${limitMb}MB 이하만 올릴 수 있어요.`
  }

  return null
}
