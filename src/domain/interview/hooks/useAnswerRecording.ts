import { useCallback, useRef, useState } from 'react'

import { requestAnswerUploadUrls, uploadToPresignedUrl } from '../api/mediaApi'
import { validateAnswerRecording } from '../lib/validateAnswerRecording'
import type { RecordingUploadStatus } from '../types/media'

const PREFERRED_AUDIO_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm'] as const
const PREFERRED_VIDEO_MIME_TYPES = ['video/webm;codecs=vp8,opus', 'video/webm'] as const

function pickMimeType(candidates: readonly string[], fallback: string): string {
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type
  }
  return fallback
}

function extensionFor(mimeType: string): string {
  return mimeType.includes('mp4') ? 'mp4' : 'webm'
}

type ActiveRecorder = {
  recorder: MediaRecorder
  chunks: Blob[]
}

function startRecorder(stream: MediaStream, mimeType: string): ActiveRecorder {
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: Blob[] = []

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  })

  recorder.start()
  return { recorder, chunks }
}

function stopRecorder(active: ActiveRecorder): Promise<Blob> {
  return new Promise((resolve) => {
    active.recorder.addEventListener(
      'stop',
      () => resolve(new Blob(active.chunks, { type: active.recorder.mimeType })),
      { once: true },
    )
    active.recorder.stop()
  })
}

export type UseAnswerRecordingResult = {
  uploadStatus: RecordingUploadStatus
  /** 질문 하나에 대한 녹화를 시작한다. 스트림이 없거나 이미 녹화 중이면 무시한다. */
  startRecording: () => void
  /** 녹화를 멈추고 오디오(필수)·영상(선택)을 presigned URL 로 올린다. */
  stopAndUpload: (questionId: string) => void
}

/**
 * 답변 녹화(오디오 필수 + 영상 선택, 서로 다른 파일)와 업로드를 담당합니다.
 * (이슈 #25, 이슈 #54 계약 확인 후 재작업 — 원래는 webm 단일 파일이었지만 백엔드가
 * 오디오·영상을 완전히 별개 파일로 받는 것으로 확인돼 MediaRecorder 를 두 개 돌린다.)
 *
 * 오디오는 마이크 전용 스트림에서, 영상은 카메라(+마이크) 스트림에서 따로 녹화한다 —
 * MediaRecorder 가 오디오만 녹음해도 `video/webm` 을 뱉는 브라우저가 흔해서, 실제
 * 스트림 구성에 맞는 mimeType 후보를 각각 따로 시도한다(`pickMimeType`). 카메라가
 * 없으면 영상은 아예 녹화하지 않는다(선택 사항).
 *
 * `useInterviewSession` 의 phase(텍스트 답변 제출)와는 별개 트랙으로 두되, 실제
 * 제출 REST(`POST /api/interviews/{sessionId}/answers`)가 audioObjectKey 를 필수로
 * 요구해서 업로드가 끝나야 제출을 부를 수 있다 — 그 연결은 `InterviewPage.tsx`
 * 쪽에 있다(// DECISION NEEDED 주석 참고).
 */
export function useAnswerRecording(
  sessionId: string,
  audioRecordingStream: MediaStream | null,
  videoRecordingStream: MediaStream | null,
): UseAnswerRecordingResult {
  const [uploadStatus, setUploadStatus] = useState<RecordingUploadStatus>({ status: 'idle' })

  const audioRef = useRef<ActiveRecorder | null>(null)
  const videoRef = useRef<ActiveRecorder | null>(null)

  const startRecording = useCallback(() => {
    if (audioRef.current || videoRef.current) return // 이미 녹화 중이다.
    // 오디오가 필수라 마이크 스트림이 없으면 영상만 따로 녹화하지 않는다 — 카메라가
    // 마이크보다 먼저 붙어도 여기서 걸러지고, 마이크가 뒤늦게 붙어 스트림이 생기면
    // startRecording 의 참조가 바뀌어 effect 가 다시 돌면서 오디오 · 영상이 같이 시작된다.
    if (!audioRecordingStream) return

    audioRef.current = startRecorder(audioRecordingStream, pickMimeType(PREFERRED_AUDIO_MIME_TYPES, 'audio/webm'))
    if (videoRecordingStream) {
      videoRef.current = startRecorder(videoRecordingStream, pickMimeType(PREFERRED_VIDEO_MIME_TYPES, 'video/webm'))
    }

    setUploadStatus({ status: 'recording' })
  }, [audioRecordingStream, videoRecordingStream])

  const stopAndUpload = useCallback(
    (questionId: string) => {
      const audio = audioRef.current
      const video = videoRef.current
      audioRef.current = null
      videoRef.current = null

      if (!audio) {
        // 오디오는 필수다(백엔드 요청 타입에 audioFileName 등이 optional 이 아니다) —
        // 마이크가 없어 오디오 자체가 없으면 애초에 업로드를 시도할 수 없다. video 는 참조만
        // 지우면 멈추지 않고 계속 녹화되니(다음 답변용 MediaRecorder 가 쌓인다) 같이 멈춘다.
        video?.recorder.stop()
        setUploadStatus({ status: 'failed', message: '녹음된 음성이 없어 업로드하지 못했어요.' })
        return
      }

      setUploadStatus({ status: 'uploading' })

      void (async () => {
        try {
          const audioBlob = await stopRecorder(audio)
          let videoBlob = video ? await stopRecorder(video) : null

          const audioValidationMessage = validateAnswerRecording('audio', audioBlob)
          if (audioValidationMessage) {
            setUploadStatus({ status: 'failed', message: audioValidationMessage })
            return
          }

          if (videoBlob) {
            const videoValidationMessage = validateAnswerRecording('video', videoBlob)
            if (videoValidationMessage) {
              // 영상은 선택 사항이다 — 영상만 문제(용량 초과, 빈 파일 등)면 오디오는
              // 그대로 올리고 영상만 생략한다. 오디오까지 버리면 멀쩡한 답변을 다시
              // 녹음하게 만든다.
              console.error(
                '답변 영상 검증 실패, 오디오만 업로드 sessionId=%s questionId=%s reason=%s',
                sessionId,
                questionId,
                videoValidationMessage,
              )
              videoBlob = null
            }
          }

          const uploadUrls = await requestAnswerUploadUrls(sessionId, {
            questionId,
            audioFileName: `${questionId}-audio.${extensionFor(audioBlob.type)}`,
            audioMimeType: audioBlob.type,
            audioSize: audioBlob.size,
            ...(videoBlob
              ? {
                  videoFileName: `${questionId}-video.${extensionFor(videoBlob.type)}`,
                  videoMimeType: videoBlob.type,
                  videoSize: videoBlob.size,
                }
              : {}),
          })

          await uploadToPresignedUrl(uploadUrls.audioUploadUrl, audioBlob)
          if (videoBlob && uploadUrls.videoUploadUrl) {
            await uploadToPresignedUrl(uploadUrls.videoUploadUrl, videoBlob)
          }

          setUploadStatus({
            status: 'uploaded',
            audioObjectKey: uploadUrls.audioObjectKey,
            videoObjectKey: videoBlob ? (uploadUrls.videoObjectKey ?? null) : null,
          })
        } catch (error) {
          // 개인정보(답변 전문)는 안 남긴다 — sessionId/questionId 만 남긴다.
          console.error('답변 녹화 업로드 실패 sessionId=%s questionId=%s', sessionId, questionId, error)
          setUploadStatus({
            status: 'failed',
            message: '답변 영상을 올리지 못했어요.',
          })
        }
      })()
    },
    [sessionId],
  )

  return { uploadStatus, startRecording, stopAndUpload }
}
