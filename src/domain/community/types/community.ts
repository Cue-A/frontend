/**
 * 커뮤니티. API 명세서에 이 도메인 자체가 없어서(기능명세서에도 없음 — INT/REP 처럼 기능 ID 가 없습니다)
 * 아래 경로 · 타입은 전부 화면을 먼저 만들어두기 위한 임시 계약입니다. 백엔드 작업이 시작되면
 * 이 파일과 `api/communityMock.ts` 를 실제 계약에 맞춰 고쳐야 합니다.
 */
export type CommunityTab = 'info' | 'study'

export type StudyStatus = 'RECRUITING' | 'CLOSED'

/** B-04 커뮤니티/스터디모집 한 건 */
export type StudyPost = {
  postId: string
  title: string
  currentCount: number
  capacity: number
  /** 시안 그대로 "8/5" 같은 표시용 문자열입니다 — 실제 계약이 생기면 ISO 날짜로 바꿉니다 */
  deadlineLabel: string
  status: StudyStatus
}

/** B-04 커뮤니티/정보공유 한 건 */
export type InfoPost = {
  postId: string
  title: string
  author: string
  /** 시안 그대로 "3일 전" 같은 표시용 문자열입니다 */
  postedAtLabel: string
  commentCount: number
  likeCount: number
}
