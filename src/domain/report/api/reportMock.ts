import { registerMock } from '@/shared/api/mock'

import type { Report } from '../types/report'

/**
 * 백엔드가 준비되기 전까지 화면을 그리기 위한 가짜 리포트입니다.
 * 값은 C-01 시안에 적힌 것을 그대로 옮겼습니다. 계약이 확정되면 교체합니다.
 *
 * 시안대로 **시선 분석이 실패한 상태**로 두었습니다. 빈 값·실패 값일 때
 * 화면이 어떻게 되는지가 리포트에서 제일 자주 겪을 상황이기 때문입니다.
 */
const SAMPLE_REPORT: Report = {
  reportId: 'r3',
  sessionId: 's3',
  analysisStatus: 'COMPLETED',
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

  totalScore: 82,
  totalScoreDelta: { fromAttempt: 2, diff: 6 },

  notices: [
    '시선 분석에 실패해 시선 점수는 이번 회차에서 제외되었습니다. 말하기 · 내용 · 답변 마무리는 정상 분석되었습니다.',
  ],

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

  metrics: [
    { key: 'content', label: '내용', score: 84, unavailableLabel: null },
    { key: 'speech', label: '말하기', score: 78, unavailableLabel: null },
    {
      key: 'vision',
      label: '시선',
      score: null,
      unavailableLabel: '분석 실패',
    },
    { key: 'closing', label: '답변 마무리', score: 76, unavailableLabel: null },
  ],
  subMetrics: [
    {
      key: 'resilience',
      label: '회복력',
      value: '75%',
      description: '압박 질문(Q3) 이후 약 40초 만에 답변 안정도를 회복했어요.',
    },
    {
      key: 'closing',
      label: '답변 마무리',
      value: '4 / 5',
      description: '깔끔한 맺음 · 다음 연습에서는 결론을 먼저 말하기를 시도해보세요.',
    },
  ],
  metricsComment: '2회차 대비 내용 구성이 가장 크게 좋아졌어요',

  improvedAnswer: {
    turnTitle: 'Q3 직무역량',
    myAnswer:
      '저는 데이터 분석 프로젝트에서 전처리를 담당했고 어… 랜덤 포레스트를 사용해서 성능을 좀 올렸습니다.',
    example:
      '이탈률 예측 프로젝트에서 전처리를 맡아, 결측 구간을 재정의해 학습 데이터를 12% 늘렸습니다. 그 결과 모델 F1이 0.71에서 0.78로 개선됐습니다.',
  },
}

registerMock('GET', '/api/reports/:reportId', ({ reportId }) => ({
  ...SAMPLE_REPORT,
  reportId,
}))
