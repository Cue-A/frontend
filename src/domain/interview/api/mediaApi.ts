import { api } from '@/shared/api/apiClient'
import { ApiError } from '@/shared/api/apiError'
import { USE_MOCK } from '@/shared/api/mock'

import type { AnswerUploadUrlsRequest, AnswerUploadUrlsResponse } from '../types/media'

import './mediaMock'

/**
 * 답변 녹화 업로드 1단계 — presigned URL 발급입니다. (이슈 #54, `feat/24-interview-answer-flow`
 * 확인 기준) 오디오·영상 것을 한 번에 요청한다. sessionId 는 경로에만 있고 본문에는
 * 없다 — 본문 필드는 이슈에서 확인된 값 그대로다.
 */
export function requestAnswerUploadUrls(sessionId: string, request: AnswerUploadUrlsRequest) {
  return api.post<AnswerUploadUrlsResponse>(`/api/interviews/${sessionId}/answers/upload-urls`, request)
}

/**
 * 2단계 — presigned URL 은 우리 백엔드가 아니라 스토리지(S3 호환)로 직접 가는
 * 요청이라 `Result<T>` 봉투도 안 쓰고 `Authorization` 헤더도 안 붙는다 — URL 자체의
 * 서명이 인증이다. 그래서 `shared/api/apiClient` 를 거치지 않고 `fetch` 를 직접 쓴다.
 *
 * mock 모드에서는 uploadUrl 이 실제 주소가 아니라서(mediaMock.ts 참고) fetch 하지
 * 않고 바로 성공으로 취급한다.
 *
 * 3단계(완료 통보)는 별도 엔드포인트가 없다 — `sessionApi.submitAnswer` 가 호출하는
 * `POST /api/interviews/{sessionId}/answers` 자체가 완료 통보를 겸한다.
 */
export async function uploadToPresignedUrl(uploadUrl: string, blob: Blob): Promise<void> {
  if (USE_MOCK) return

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type },
    body: blob,
  })

  if (!response.ok) {
    throw new ApiError('UPLOAD_FAILED', `녹화 업로드에 실패했어요 (${response.status})`)
  }
}
