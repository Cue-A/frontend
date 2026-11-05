import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { ReportComparisonResponse } from './reportComparisonApi'
import { MOCK_REPORT_IDS } from './reportMock'

/**
 * 회차 비교 목업입니다. 백엔드 응답 모양 그대로이고, `reports` 를 `VITE_REAL_APIS` 에 넣으면 실제 서버로 갑니다.
 *
 * 기준 리포트 id 로 경우를 고릅니다. 성장 관리 목업(`growth/api/growthMock.ts`)이 시나리오마다 아래 id 를 "가장 최근
 * 리포트" 로 내려줍니다 — 도메인끼리 api 를 서로 가져다 쓰지 않는 규칙이라 id 는 양쪽에 같은 글자로 적어 둡니다.
 *
 * | 기준 리포트 | 응답 |
 * |---|---|
 * | `…a005` (기본 · 목록에 없는 id) | 5회차까지 모두 완료 — 성장 관리 시안의 68 · 72 · 71 · 78 · 82 |
 * | `…a001` | 1회차뿐 — `vsPrevious: null` (오류 아님) |
 * | `…a104` | 1 · 2 · 4회차 — 3회차는 리포트가 없어 빠지고, 2회차는 부분 리포트(종합 점수 null) |
 * | `…a503` | `AI_UNAVAILABLE` (503) |
 * | `…a777` | 값이 빠지거나 null 인 응답 — 시선 축 배열 자체가 null, 시선 변화량 · 문항 배열 없음, 3회차 리포트 정보 없음 (이슈 #140) |
 * | `…a000` | 비교한 회차가 0개 (`comparedRounds: []`) (이슈 #140) |
 *
 * 리포트 화면의 목업 리포트(`reportMock.ts`)는 기본 응답(5회차)을 받고, "요약 없음" 회차(`…3c01`)만 재연습 이력이 없는
 * 리포트로 1회차뿐인 응답을 받습니다 — 리포트 화면의 "아직 비교할 회차가 없어요" 를 보려는 것입니다 (이슈 #157).
 *
 * AI 가 계산하느라 몇 초 걸리는 API 라 0.8초 늦게 답합니다. 화면이 이 카드만 따로 로딩을 보여주는지 확인하려는 것입니다.
 */

export const MOCK_COMPARISON_REPORT_IDS = {
  fiveRounds: 'c4e0b1a2-6d3f-4e8a-9b7c-2f1d0e3aa005',
  firstRound: 'c4e0b1a2-6d3f-4e8a-9b7c-2f1d0e3aa001',
  withGap: 'c4e0b1a2-6d3f-4e8a-9b7c-2f1d0e3aa104',
  aiUnavailable: 'c4e0b1a2-6d3f-4e8a-9b7c-2f1d0e3aa503',
  loose: 'c4e0b1a2-6d3f-4e8a-9b7c-2f1d0e3aa777',
  noRounds: 'c4e0b1a2-6d3f-4e8a-9b7c-2f1d0e3aa000',
} as const

const DELAY_MS = 800

const roundReportId = (round: number) => `c4e0b1a2-6d3f-4e8a-9b7c-2f1d0e3ab00${round}`

/** 오늘에서 `daysAgo` 일 전 오전 10시 */
function startedAt(daysAgo: number) {
  const date = new Date()
  date.setHours(10, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function fiveRounds(reportId: string): ReportComparisonResponse {
  return {
    reportId,
    latestRound: 5,
    comparedRounds: [1, 2, 3, 4, 5],
    partialRounds: [],
    rounds: [1, 2, 3, 4, 5].map((round) => ({
      round,
      reportId: round === 5 ? reportId : roundReportId(round),
      status: 'COMPLETED',
      createdAt: startedAt((5 - round) * 6 + 1),
    })),
    vsPrevious: {
      fromRound: 4,
      toRound: 5,
      overallDelta: 4,
      axisDelta: { content: 8, speech: -2, gaze: null },
      improved: ['q_1', 'q_3'],
      declined: ['q_2'],
      unchanged: [],
      comment:
        '4회차(78점) 대비 4점 올라 82점을 기록했어요. 내용 구성이 76점에서 84점으로 가장 크게 좋아졌고, 필러워드는 18회에서 9회로 절반 줄었습니다.',
    },
    trend: {
      overall: [68, 72, 71, 78, 82],
      axes: {
        content: [66, 70, 72, 76, 84],
        speech: [70, 74, 69, 79, 77],
        gaze: [64, 71, 70, null, 80],
      },
      comment:
        '반면 압박 질문 대응은 71점으로 5회차 중 가장 낮았고, 3회차에 한 번 떨어진 뒤 아직 회복되지 않았어요. 다음 연습에서는 압박 강도를 유지한 채 결론부터 말하는 연습을 해보면 좋겠습니다.',
      stalledAxes: ['speech'],
      bestRound: 5,
    },
    byQuestion: [
      {
        questionId: 'q_1',
        questionText: '이 직무에 지원한 동기는 무엇인가요?',
        category: '지원동기',
        scores: [62, 66, 70, 74, 80],
        deltaFromPrevious: 6,
        deltaFromFirst: 18,
        comment: '회사 소개 문구 대신 본인 경험으로 동기를 설명하기 시작했어요.',
      },
      {
        questionId: 'q_2',
        questionText: '팀원과 의견이 갈렸던 경험을 말씀해 주세요.',
        category: '협업·갈등',
        scores: [70, 72, 68, 79, 76],
        deltaFromPrevious: -3,
        deltaFromFirst: 6,
        comment: '결론을 먼저 말했지만 갈등을 푼 과정 설명이 4회차보다 짧아졌어요.',
      },
      {
        questionId: 'q_3',
        // 백엔드가 원문을 못 찾으면 null 입니다 — 화면은 "질문 N" 으로 둡니다
        questionText: null,
        category: '직무역량',
        scores: [72, 75, 75, 80, 88],
        deltaFromPrevious: 8,
        deltaFromFirst: 16,
        comment: null,
      },
    ],
  }
}

function firstRound(reportId: string): ReportComparisonResponse {
  return {
    reportId,
    latestRound: 1,
    comparedRounds: [1],
    partialRounds: [],
    rounds: [{ round: 1, reportId, status: 'COMPLETED', createdAt: startedAt(1) }],
    vsPrevious: null,
    trend: {
      overall: [68],
      axes: { content: [66], speech: [70], gaze: [64] },
      comment: '',
      stalledAxes: [],
      bestRound: 1,
    },
    byQuestion: [],
  }
}

function withGap(reportId: string): ReportComparisonResponse {
  return {
    reportId,
    latestRound: 4,
    comparedRounds: [1, 2, 4],
    partialRounds: [2],
    rounds: [
      { round: 1, reportId: roundReportId(1), status: 'COMPLETED', createdAt: startedAt(20) },
      { round: 2, reportId: roundReportId(2), status: 'PARTIAL', createdAt: startedAt(13) },
      { round: 4, reportId, status: 'COMPLETED', createdAt: startedAt(1) },
    ],
    vsPrevious: {
      // 3회차 리포트가 없어서 4회차는 2회차와 비교합니다 (latestRound - 1 이 아님)
      fromRound: 2,
      toRound: 4,
      // 2회차가 부분 리포트라 종합 점수는 비교할 수 없습니다
      overallDelta: null,
      axisDelta: { content: 5, speech: 0, gaze: null },
      improved: ['q_1'],
      declined: [],
      unchanged: ['q_2'],
      comment: '2회차보다 근거를 수치로 제시하는 답변이 늘었습니다. 시선은 2회차에 분석하지 못해 비교하지 않았어요.',
    },
    trend: {
      overall: [70, null, 77],
      axes: { content: [68, 72, 77], speech: [71, 74, 74], gaze: [69, null, 75] },
      comment: '내용 점수가 꾸준히 오르고 있습니다.',
      stalledAxes: [],
      bestRound: 4,
    },
    byQuestion: [
      {
        questionId: 'q_1',
        questionText: '가장 자신 있는 기술 스택은 무엇인가요?',
        category: '직무역량',
        scores: [68, null, 74],
        deltaFromPrevious: null,
        deltaFromFirst: 6,
        comment: '2회차는 이 문항을 분석하지 못해 1회차와 비교했어요.',
      },
    ],
  }
}

/**
 * 명세 예시보다 느슨한 응답입니다. 실서버(AI) 응답이 이렇게 와도 화면이 멈추지 않는지 확인하려는 것입니다 (이슈 #140).
 * - 시선을 한 번도 못 잰 면접 — `trend.axes.gaze` 배열 자체가 null
 * - `vsPrevious.axisDelta.gaze` · `overallDelta` 가 아예 없음, `improved` 등 문항 배열도 없음
 * - `rounds[]` 에 3회차 정보가 없음 — 3회차 막대는 링크 없이 그려집니다
 */
function loose(reportId: string): ReportComparisonResponse {
  return {
    reportId,
    latestRound: 3,
    comparedRounds: [1, 2, 3],
    partialRounds: null,
    rounds: [
      { round: 1, reportId: roundReportId(1), status: 'COMPLETED', createdAt: startedAt(14) },
      { round: 2, reportId: roundReportId(2), status: 'COMPLETED', createdAt: startedAt(7) },
    ],
    vsPrevious: {
      axisDelta: { content: 3, speech: -1 },
      comment: '말하기 속도가 조금 빨라졌지만 내용 구성은 더 단단해졌어요.',
    },
    trend: {
      overall: [65, 69, 72],
      axes: { content: [64, 70, 73], speech: [66, 68, 67], gaze: null },
      comment: null,
    },
  }
}

function noRounds(reportId: string): ReportComparisonResponse {
  return {
    reportId,
    latestRound: 1,
    comparedRounds: [],
    partialRounds: [],
    rounds: [],
    vsPrevious: null,
    trend: { overall: [], axes: { content: [], speech: [], gaze: [] }, comment: '', stalledAxes: [], bestRound: null },
    byQuestion: [],
  }
}

registerMock(
  'GET',
  '/api/reports/:reportId/comparison',
  async ({ reportId }) => {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS))

    switch (reportId) {
      case MOCK_COMPARISON_REPORT_IDS.firstRound:
      case MOCK_REPORT_IDS.noExtras:
        return firstRound(reportId)
      case MOCK_COMPARISON_REPORT_IDS.withGap:
        return withGap(reportId)
      case MOCK_COMPARISON_REPORT_IDS.aiUnavailable:
        throw new ApiError('AI_UNAVAILABLE', 'AI 서버에 연결할 수 없습니다')
      case MOCK_COMPARISON_REPORT_IDS.loose:
        return loose(reportId)
      case MOCK_COMPARISON_REPORT_IDS.noRounds:
        return noRounds(reportId)
      default:
        return fiveRounds(reportId)
    }
  },
)
