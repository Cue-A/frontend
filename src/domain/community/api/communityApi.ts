import { api } from '@/shared/api/apiClient'

import type { InfoPost, StudyPost } from '../types/community'

import './communityMock'

/**
 * 커뮤니티 목록 조회. 경로는 전부 임시입니다 — API 명세서에 커뮤니티 도메인이 없습니다
 * (기능명세서에도 기능 ID 가 없음). 백엔드 계약이 정해지면 이 파일을 맞춰 고칩니다.
 */
export function getStudyPosts() {
  return api.get<StudyPost[]>('/api/community/study-posts')
}

export function getInfoPosts() {
  return api.get<InfoPost[]>('/api/community/info-posts')
}
