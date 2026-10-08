import { registerMock } from '@/shared/api/mock'

import type { InfoPost, StudyPost } from '../types/community'

/** B-04 커뮤니티/스터디모집 시안의 목록 그대로입니다. */
const STUDY_POSTS: StudyPost[] = [
  { postId: 'study-1', title: '백엔드 스터디원 모집합니다', currentCount: 3, capacity: 5, deadlineLabel: '8/5', status: 'RECRUITING' },
  { postId: 'study-2', title: 'AI 면접 스터디 같이 하실 분', currentCount: 2, capacity: 4, deadlineLabel: '8/20', status: 'RECRUITING' },
  { postId: 'study-3', title: '데이터 분석 직무 준비 스터디', currentCount: 5, capacity: 5, deadlineLabel: '8/10', status: 'CLOSED' },
  { postId: 'study-4', title: '프론트엔드 신입 스터디 모집', currentCount: 1, capacity: 6, deadlineLabel: '8/25', status: 'RECRUITING' },
  { postId: 'study-5', title: '자소서 첨삭 스터디 (주 1회)', currentCount: 4, capacity: 4, deadlineLabel: '8/12', status: 'CLOSED' },
  { postId: 'study-6', title: '공기업 NCS 스터디원 구합니다', currentCount: 2, capacity: 5, deadlineLabel: '9/1', status: 'RECRUITING' },
  { postId: 'study-7', title: '기획직 포트폴리오 리뷰 스터디', currentCount: 3, capacity: 6, deadlineLabel: '8/30', status: 'RECRUITING' },
]

/** B-04 커뮤니티/정보공유 시안의 목록 그대로입니다. */
const INFO_POSTS: InfoPost[] = [
  { postId: 'info-1', title: '랜덤포레스트 면접 후기 공유합니다', author: '김oo', postedAtLabel: '3일 전', commentCount: 3, likeCount: 12 },
  { postId: 'info-2', title: '면접 압박 질문 대처법 정리', author: '이oo', postedAtLabel: '1일 전', commentCount: 8, likeCount: 24 },
  { postId: 'info-3', title: '자소서 첨삭 후기', author: '박oo', postedAtLabel: '5일 전', commentCount: 7, likeCount: 6 },
  { postId: 'info-4', title: '필러워드 줄이는 팁 공유', author: '최oo', postedAtLabel: '1주 전', commentCount: 2, likeCount: 6 },
  { postId: 'info-5', title: '면접 압박 질문 대처법 정리', author: '최oo', postedAtLabel: '1주 전', commentCount: 2, likeCount: 6 },
  { postId: 'info-6', title: '면접 후기', author: '최oo', postedAtLabel: '1주 전', commentCount: 2, likeCount: 6 },
  { postId: 'info-7', title: '필러워드 줄이는 팁 공유', author: '최oo', postedAtLabel: '1주 전', commentCount: 2, likeCount: 6 },
]

registerMock('GET', '/api/community/study-posts', () => [...STUDY_POSTS], {
  missingInBackend: '커뮤니티 API 없음 (기능명세서·API명세서 모두 미정)',
})

registerMock('GET', '/api/community/info-posts', () => [...INFO_POSTS], {
  missingInBackend: '커뮤니티 API 없음 (기능명세서·API명세서 모두 미정)',
})
