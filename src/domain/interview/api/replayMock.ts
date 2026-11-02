import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { ReplayOptionsResponse } from './replayApi'

/**
 * 재연습 조건 조회 목업입니다. 응답 모양과 실패 코드는 백엔드 `ReplaySessionOptionsService` 를 따랐습니다. (이슈 #152)
 *
 * 리포트 목업 회차(`reportMock.ts`)의 `sessionId` 별로 상황을 나눠 둡니다. 리포트의 "다시 연습하기" 로 들어오면
 * 그 회차의 상황이 보입니다.
 *
 * | sessionId | 상황 |
 * |---|---|
 * | `…4e01` (요약 없음 회차) | 기업 정보를 쓸 수 없음 (`COMPANY_UNVERIFIED`) |
 * | `…4e02` (카메라 미사용 회차) | 자기소개서가 지워짐 (`DOCUMENT_DELETED`) |
 * | `…4e04` (말하기 · 시선 실패 회차) | 기업 없이 본 연습 모드 — 시작 가능 |
 * | `not-completed` | 끝나지 않은 면접 — `SESSION_NOT_COMPLETED` |
 * | 그 밖의 id | 카카오 기업 면접 — 시작 가능 |
 */
const BASE: ReplayOptionsResponse = {
  rootSessionId: '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e00',
  // 문서 목업(`documentMock.ts`)의 "카카오_자기소개서.pdf" 입니다
  documentId: '6f1c2a3b-4d5e-4f60-8a1b-2c3d4e5f6071',
  documentTitle: '카카오_자기소개서.pdf',
  companyId: 5,
  companyName: '카카오',
  jobRole: '프론트엔드 개발자',
  questionCount: 6,
  persona: 'FRIENDLY',
  replayable: true,
  replayBlockReasons: [],
}

/** 백엔드가 같이 주는 문구 그대로입니다. 화면은 아는 코드면 프론트 문구로 바꿉니다 */
const BACKEND_MESSAGES = {
  DOCUMENT_DELETED: '최초 면접에 사용한 이력서가 삭제되어 재연습을 시작할 수 없습니다',
  COMPANY_UNVERIFIED: '최초 면접에 사용한 기업 정보를 현재 사용할 수 없어 재연습을 시작할 수 없습니다',
} as const

const SCENARIOS: Record<string, Partial<ReplayOptionsResponse>> = {
  '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e01': {
    replayable: false,
    replayBlockReasons: [{ code: 'COMPANY_UNVERIFIED', message: BACKEND_MESSAGES.COMPANY_UNVERIFIED }],
  },
  '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e02': {
    documentTitle: '지운_자기소개서.pdf',
    replayable: false,
    replayBlockReasons: [{ code: 'DOCUMENT_DELETED', message: BACKEND_MESSAGES.DOCUMENT_DELETED }],
  },
  '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e04': {
    companyId: null,
    companyName: null,
    jobRole: '데이터 분석가',
    questionCount: 3,
    persona: 'PRESSURE',
  },
}

const NOT_COMPLETED_SESSION_ID = 'not-completed'

/** 이 세션으로 재연습하면 쓰일 최초 세션의 조건입니다. 세션 시작 목업(`sessionMock.ts`)이 비교할 때도 씁니다 */
export function mockReplayOptionsOf(sessionId: string): ReplayOptionsResponse {
  if (sessionId === NOT_COMPLETED_SESSION_ID) {
    throw new ApiError('SESSION_NOT_COMPLETED', '완료된 세션만 재연습할 수 있습니다')
  }
  return { ...BASE, ...SCENARIOS[sessionId] }
}

registerMock('GET', '/api/interviews/:sessionId/replay-options', ({ sessionId }) => mockReplayOptionsOf(sessionId))
