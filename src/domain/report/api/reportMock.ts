import { registerMock } from '@/shared/api/mock'

import type { Report, ReportVideo, SubMetric } from '../types/report'

import type { AnalysisResult } from './analysisResponse'
import {
  toHesitationMetric,
  toPartialNotices,
  toResilienceMetric,
  toScoreGateReason,
  toScoreMetrics,
} from './analysisResponse'

/**
 * AI 분석 결과 부분입니다. **전달 문서의 응답 모양 그대로** 적었습니다.
 *
 * 화면용 모양으로 미리 다듬어두면 변환 함수가 한 번도 안 돌아서, 실제 응답이
 * 왔을 때 처음 돌아가게 됩니다. 목업이라도 서버가 주는 모양으로 두는 편이
 * 변환층을 실제로 검증합니다.
 *
 * 시안대로 **시선 분석이 실패한 상태**입니다. 빈 값 · 실패 값일 때 화면이
 * 어떻게 되는지가 리포트에서 제일 자주 겪을 상황이기 때문입니다.
 */
const SAMPLE_ANALYSIS: AnalysisResult = {
  report_status: 'partial',
  overall: {
    score: 82,
    display: 4,
    gated: false,
    gate_reason: null,
    partial: true,
    axes_used: ['content', 'speech'],
    axes_failed: ['gaze'],
  },
  axes: {
    content: {
      status: 'ok',
      score: 84,
      display: 4,
      // 내용 축 metrics 는 계약서에서 아직 빈 객체입니다. 비어 있는 게 오류가 아닙니다.
      metrics: {},
      evidence: [
        {
          question_id: 'q3',
          t_start: 208,
          t_end: 216.4,
          kind: 'weakness',
          label: '근거 부족',
          comment: '선택 이유를 설명했으나 비교 대상이 제시되지 않았습니다.',
        },
      ],
    },
    speech: {
      status: 'ok',
      score: 78,
      display: 4,
      // 말하기 축만 키가 확정됐습니다. 내용 · 시선은 아직 빈 객체입니다.
      metrics: { hesitation_score: 32, speech_rate_cv: 0.284, repetition_count: 3 },
      evidence: [],
    },
    gaze: {
      status: 'failed',
      score: null,
      display: null,
      metrics: null,
      evidence: [],
      error_code: 'GAZE_FAILED',
    },
  },
  resilience: {
    score: 58,
    display: 3,
    comment: '압박 질문 이후 답변 길이가 절반으로 줄었습니다.',
  },
}

/**
 * 시선을 **안 쓴** 회차입니다. 실패(`failed`)와 미사용(`skipped`)이 화면에서
 * 다르게 보이는지 확인하려고 둡니다. 친절형 면접이라 회복력도 없고, 총점에
 * 상한이 걸린 경우까지 한 번에 볼 수 있습니다.
 */
const SKIPPED_ANALYSIS: AnalysisResult = {
  report_status: 'partial',
  overall: {
    score: 40,
    display: 2,
    gated: true,
    gate_reason: 'content_relevance_low',
    partial: true,
    axes_used: ['content', 'speech'],
    axes_failed: [],
  },
  axes: {
    content: { status: 'ok', score: 38, display: 2, metrics: {}, evidence: [] },
    speech: {
      status: 'ok',
      score: 72,
      display: 4,
      metrics: { hesitation_score: 54, speech_rate_cv: 0.41, repetition_count: 6 },
      evidence: [],
    },
    gaze: {
      status: 'skipped',
      score: null,
      display: null,
      metrics: null,
      evidence: [],
      reason: 'no_video',
    },
  },
  resilience: null,
}

/** 값이 있는 보조 지표만 모읍니다. 없는 지표는 자리도 만들지 않습니다. */
function toSubMetrics(analysis: AnalysisResult): SubMetric[] {
  return [
    toResilienceMetric(analysis.resilience),
    toHesitationMetric(analysis.axes.speech),
  ].filter((item): item is SubMetric => item !== null)
}

/**
 * 백엔드가 준비되기 전까지 화면을 그리기 위한 가짜 리포트입니다.
 * 값은 C-01 시안에 적힌 것을 그대로 옮겼습니다. 계약이 확정되면 교체합니다.
 */
const SAMPLE_REPORT: Report = {
  reportId: 'r3',
  sessionId: 's3',
  status: 'partial',
  companyName: '네이버',
  jobRole: '기획 직무',
  interviewDate: '2026.07.18',
  questionCount: 4,

  attempt: 3,
  attempts: [
    { attempt: 1, reportId: 'r1', isLatest: false },
    { attempt: 2, reportId: 'r2', isLatest: false },
    { attempt: 3, reportId: 'r3', isLatest: true },
  ],

  totalScore: SAMPLE_ANALYSIS.overall.score,
  totalScoreDisplay: SAMPLE_ANALYSIS.overall.display,
  totalScoreDelta: { fromAttempt: 2, diff: 6 },
  scoreGateReason: toScoreGateReason(SAMPLE_ANALYSIS.overall),

  notices: toPartialNotices(SAMPLE_ANALYSIS),

  summary: {
    verdict:
      '자기소개와 협업 경험은 안정적으로 풀었지만, 3번 꼬리질문에서 흐름이 한 번 끊겼습니다. 끊긴 뒤 다시 페이스를 찾는 데 40초가 걸렸어요.',
    overview: [
      { key: 'total', label: '총 소요', value: '05:48' },
      { key: 'average', label: '평균 답변', value: '1:27' },
      { key: 'questions', label: '질문 수', value: '4문항' },
      { key: 'style', label: '면접관 스타일', value: '압박형' },
    ],
    turns: [
      {
        turnId: 1,
        title: 'Q1 자기소개',
        comment: '두괄식으로 정리해 도입이 매끄러웠습니다',
        status: '안정',
        startSeconds: 12,
        endSeconds: 95,
        score: 82,
      },
      {
        turnId: 2,
        title: 'Q2 지원동기',
        comment: '근거는 충분했지만 한 문장이 길어졌습니다',
        status: '보통',
        startSeconds: 105,
        endSeconds: 190,
        score: 79,
      },
      {
        turnId: 3,
        title: 'Q3 직무역량 · 압박 꼬리질문',
        comment: '8초 침묵 후 답변이 추상적으로 흘렀습니다',
        status: '흔들림',
        startSeconds: 200,
        endSeconds: 295,
        score: 71,
      },
      {
        turnId: 4,
        title: 'Q4 협업경험',
        comment: '사례가 구체적이어서 톤을 회복했습니다',
        status: '안정',
        startSeconds: 302,
        endSeconds: 348,
        score: 85,
      },
    ],
    strengths: [
      { text: '결론을 먼저 말하는 구조', startSeconds: 14, endSeconds: 29 },
      { text: '경험을 수치와 함께 제시', startSeconds: 316, endSeconds: 334 },
    ],
    weaknesses: [
      { text: '예상 밖 질문에서 침묵', startSeconds: 208, endSeconds: 216 },
      // 시각을 못 잡은 경우도 섞어둡니다
      { text: '추상적 표현으로 마무리', startSeconds: null, endSeconds: null },
    ],
  },

  metrics: toScoreMetrics(SAMPLE_ANALYSIS.axes),
  subMetrics: toSubMetrics(SAMPLE_ANALYSIS),
  metricsComment: '2회차 대비 내용 구성이 가장 크게 좋아졌어요',

  improvedAnswer: {
    turnTitle: 'Q3 직무역량',
    myAnswer:
      '저는 데이터 분석 프로젝트에서 전처리를 담당했고 어… 랜덤 포레스트를 사용해서 성능을 좀 올렸습니다.',
    example:
      '이탈률 예측 프로젝트에서 전처리를 맡아, 결측 구간을 재정의해 학습 데이터를 12% 늘렸습니다. 그 결과 모델 F1이 0.71에서 0.78로 개선됐습니다.',
  },

  // 재생 주소는 아직 계약이 없어서 비워둡니다. 화면은 "재생 자리"까지만 그리고
  // 실제 재생은 계약이 온 뒤에 붙입니다. (이슈 #38)
  video: {
    playUrl: null,
    isExpired: false,
    durationSeconds: 348,
    qualityLabel: '원본 화질',
  },
}

/**
 * 링크 만료 상태(시안 `상태C`)도 확인할 수 있게 회차 하나를 만료로 둡니다.
 * 오래된 회차가 먼저 만료되는 게 자연스러워서 1회차로 골랐습니다.
 */
const EXPIRED_VIDEO: ReportVideo = {
  playUrl: null,
  isExpired: true,
  durationSeconds: 348,
  qualityLabel: null,
}

const EXPIRED_NOTICE =
  '보안을 위해 영상 재생 링크는 일정 시간이 지나면 만료됩니다. 점수와 분석 내용은 그대로 확인할 수 있습니다.'

/**
 * 회차별로 다른 상태를 보여줍니다. 연동 전에 화면 분기를 눈으로 확인하는 용도입니다.
 *
 * - `r1` — 영상 링크 만료 (시안 `상태C`)
 * - `r2` — 시선 **미사용**(카메라 안 켬) · 회복력 없음(친절형) · 총점 상한 걸림
 * - `r3` — 시선 **분석 실패** (기본)
 */
registerMock('GET', '/api/reports/:reportId', ({ reportId }) => {
  const isExpired = reportId === 'r1'

  if (reportId === 'r2') {
    return {
      ...SAMPLE_REPORT,
      reportId,
      attempt: 2,
      status: 'partial',
      // 회복력이 없는 건 친절형 면접이기 때문입니다. 개요도 같이 맞춰둡니다.
      summary: {
        ...SAMPLE_REPORT.summary,
        overview: SAMPLE_REPORT.summary.overview.map((fact) =>
          fact.key === 'style' ? { ...fact, value: '친절형' } : fact,
        ),
      },
      totalScore: SKIPPED_ANALYSIS.overall.score,
      totalScoreDisplay: SKIPPED_ANALYSIS.overall.display,
      totalScoreDelta: null,
      scoreGateReason: toScoreGateReason(SKIPPED_ANALYSIS.overall),
      notices: toPartialNotices(SKIPPED_ANALYSIS),
      metrics: toScoreMetrics(SKIPPED_ANALYSIS.axes),
      subMetrics: toSubMetrics(SKIPPED_ANALYSIS),
    }
  }

  return {
    ...SAMPLE_REPORT,
    reportId,
    video: isExpired ? EXPIRED_VIDEO : SAMPLE_REPORT.video,
    notices: isExpired ? [...SAMPLE_REPORT.notices, EXPIRED_NOTICE] : SAMPLE_REPORT.notices,
  }
})
