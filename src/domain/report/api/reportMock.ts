import { registerMock } from '@/shared/api/mock'

import type {
  Report,
  ReportSummary,
  ReportVideo,
  RetryAxis,
  SubMetric,
  TurnFlow,
} from '../types/report'

import type {
  AnalysisResult,
  AxisKey,
  AxisResponse,
  QuestionScoreResponse,
} from './analysisResponse'
import {
  toCompanyComment,
  toHesitationMetric,
  toPartialNotices,
  toQuestionComment,
  toResilienceMetric,
  toScoreGateReason,
  toScoreMetrics,
  toVerdict,
} from './analysisResponse'

/**
 * 문항 하나의 채점 결과를 만듭니다. 화면이 쓰는 건 번호 · 코멘트뿐이라 나머지는 그럴듯한 값으로 채웁니다.
 * 축 점수는 리포트의 축 상태와 맞춥니다 — 실패한 축은 문항에서도 null 입니다.
 */
function toQuestion(
  number: number,
  score: number,
  axes: Record<AxisKey, number | null>,
  comment: string | null,
): QuestionScoreResponse {
  return {
    question_id: `q${number}`,
    question_number: number,
    category: null,
    difficulty: null,
    is_replay: false,
    is_spare_topic: false,
    score,
    display: Math.min(5, Math.max(1, Math.ceil(score / 20))),
    axes,
    transcript: '',
    duration_sec: 80,
    word_count: 120,
    was_timeout: false,
    had_reask: false,
    comment,
  }
}

/** 문항별 한 줄 코멘트입니다. 값은 C-01 시안의 "면접 흐름" 문구를 그대로 옮겼습니다. */
const QUESTION_COMMENTS = [
  '두괄식으로 정리해 도입이 매끄러웠습니다',
  '근거는 충분했지만 한 문장이 길어졌습니다',
  '8초 침묵 후 답변이 추상적으로 흘렀습니다',
  '사례가 구체적이어서 톤을 회복했습니다',
]

const QUESTION_SCORES = [82, 79, 71, 85]

/** 시선이 실패한 회차의 문항들입니다. 문항에서도 시선 점수가 비어 있습니다 */
const SAMPLE_QUESTIONS: QuestionScoreResponse[] = QUESTION_SCORES.map((score, index) =>
  toQuestion(index + 1, score, { content: score + 2, speech: score - 4, gaze: null }, QUESTION_COMMENTS[index]),
)

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
  summary:
    '자기소개와 협업 경험은 안정적으로 풀었지만, 3번 꼬리질문에서 흐름이 한 번 끊겼습니다. 끊긴 뒤 다시 페이스를 찾는 데 40초가 걸렸어요.',
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
  questions: SAMPLE_QUESTIONS,
  resilience: {
    score: 58,
    display: 3,
    comment: '압박 질문 이후 답변 길이가 절반으로 줄었습니다.',
  },
  // AI 프롬프트대로 "인재상에서 드러난 것 + 더 보여주면 좋을 것" 1~2문장입니다 (ai/report_writer.py)
  company_comment:
    '인재상에서 강조하는 협업 경험은 Q4 사례로 잘 드러났어요. 스스로 문제를 정의한 과정을 Q3 같은 직무 질문에서 더 보여주면 좋겠어요.',
}

/**
 * 시선을 **안 쓴** 회차입니다. 실패(`failed`)와 미사용(`skipped`)이 화면에서
 * 다르게 보이는지 확인하려고 둡니다. 친절형 면접이라 회복력도 없고, 총점에
 * 상한이 걸린 경우까지 한 번에 볼 수 있습니다.
 *
 * **미사용은 `partial` 이 아닙니다.** AI 구현(`ai/report_dummy.py`)이
 * `axes_failed` 를 `status == 'failed'` 인 축만으로 만들고, `report_status` ·
 * `overall.partial` 을 그 목록이 비었는지로 정합니다. `skipped` 는 거기 안
 * 들어가서, 카메라만 안 켠 회차는 `complete` · `partial: false` 로 옵니다.
 *
 * 전에는 여기를 `partial: true` 로 뒀는데 구현상 나올 수 없는 조합이었습니다.
 * 그 탓에 목업에서는 "일부 항목이 빠진 결과예요" 안내가 뜨는데 실제 연동
 * 후에는 안 떠서, 지금 확인한 화면이 나중 화면과 달랐습니다. (PR #50 리뷰)
 *
 * 미사용 축에는 다시 분석 버튼도 없습니다. 카메라를 안 켠 회차는 다시 돌려도 결과가 같습니다.
 */
const SKIPPED_ANALYSIS: AnalysisResult = {
  report_status: 'complete',
  summary: '말하기 속도는 안정됐지만, 답변이 질문에서 벗어난 구간이 있어 내용 점수가 낮게 나왔습니다.',
  overall: {
    score: 40,
    display: 2,
    gated: true,
    gate_reason: 'content_relevance_low',
    partial: false,
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
  questions: SAMPLE_QUESTIONS,
  resilience: null,
  company_comment: SAMPLE_ANALYSIS.company_comment,
}

/**
 * **말하기와 시선이 둘 다 실패한** 회차입니다. 기업을 고르지 않은 면접이기도 합니다.
 *
 * AI 가 쓰는 글이 실패했을 때(null) 화면이 어떻게 되는지도 이 회차로 봅니다.
 * - 한 줄 총평(`summary`) — null. 총평 칸을 그리지 않습니다
 * - 문항 코멘트(`questions[].comment`) — 2번 · 4번만 null. 그 줄만 코멘트 없이 제목만 남습니다
 * - 인재상 코멘트(`company_comment`) — 기업 미선택이라 null. 인재상 칸을 그리지 않습니다
 *
 * 내용만 남아서 총점도 내용 점수로만 계산된 값입니다.
 */
const BOTH_FAILED_ANALYSIS: AnalysisResult = {
  report_status: 'partial',
  summary: null,
  overall: {
    score: 84,
    display: 4,
    gated: false,
    gate_reason: null,
    partial: true,
    axes_used: ['content'],
    axes_failed: ['speech', 'gaze'],
  },
  axes: {
    content: SAMPLE_ANALYSIS.axes.content,
    speech: {
      status: 'failed',
      score: null,
      display: null,
      metrics: null,
      evidence: [],
      error_code: 'SPEECH_FAILED',
    },
    gaze: SAMPLE_ANALYSIS.axes.gaze,
  },
  questions: QUESTION_SCORES.map((score, index) =>
    toQuestion(
      index + 1,
      score,
      { content: score + 2, speech: null, gaze: null },
      index % 2 === 0 ? QUESTION_COMMENTS[index] : null,
    ),
  ),
  resilience: SAMPLE_ANALYSIS.resilience,
  company_comment: null,
}

/** 값이 있는 보조 지표만 모읍니다. 없는 지표는 자리도 만들지 않습니다. */
function toSubMetrics(analysis: AnalysisResult): SubMetric[] {
  return [
    toResilienceMetric(analysis.resilience),
    toHesitationMetric(analysis.axes.speech),
  ].filter((item): item is SubMetric => item !== null)
}

/**
 * 목업 회차의 리포트 id 입니다.
 *
 * 실제 `reportId` 는 **UUID 문자열**입니다. `Report` 엔티티가 정수 PK 와 별도로 `public_id` 를
 * 들고 있고, 문서와 같은 이유로 바깥에는 그것만 나갑니다 (이슈 #54 3-2). 목업도 같은 모양으로
 * 둬야 `r1` 같은 짧은 id 에 기대는 코드가 연동 날 깨지지 않습니다.
 */
export const MOCK_REPORT_IDS = {
  expired: 'b1f0c6a2-7d3e-4a51-9c28-5e1f0a7b3c01',
  noCamera: 'b1f0c6a2-7d3e-4a51-9c28-5e1f0a7b3c02',
  latest: 'b1f0c6a2-7d3e-4a51-9c28-5e1f0a7b3c03',
  /** 다른 면접(1회차)이라 회차 칩에는 없습니다. 주소창에 직접 넣어 엽니다 */
  bothFailed: 'b1f0c6a2-7d3e-4a51-9c28-5e1f0a7b3c04',
} as const

/** 분석 결과에서 채우는 값입니다. 목업은 이 부분을 **변환 함수로** 채워서 변환층을 같이 돌립니다 */
type AnalysisFields =
  | 'status'
  | 'totalScore'
  | 'totalScoreDisplay'
  | 'scoreGateReason'
  | 'companyComment'
  | 'metrics'
  | 'subMetrics'

/**
 * 리포트에서 백엔드가 감싸는 바깥 부분입니다(회사명 · 회차 · 영상 · 개요 …).
 * 총평과 면접 흐름의 코멘트는 AI 가 쓰므로 여기 없고 분석 결과에서 채웁니다.
 * `notices` 에는 분석과 관계없는 안내(영상 만료)만 둡니다.
 */
type ReportShell = Omit<Report, AnalysisFields | 'summary'> & {
  summary: Omit<ReportSummary, 'verdict' | 'turns'> & { turns: Omit<TurnFlow, 'comment'>[] }
}

/**
 * 백엔드가 준비되기 전까지 화면을 그리기 위한 가짜 리포트입니다.
 * 값은 C-01 시안에 적힌 것을 그대로 옮겼습니다. 계약이 확정되면 교체합니다.
 */
const SAMPLE_SHELL: ReportShell = {
  reportId: MOCK_REPORT_IDS.latest,
  sessionId: '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e03',
  companyName: '네이버',
  jobRole: '기획 직무',
  interviewDate: '2026.07.18',
  questionCount: 4,

  attempt: 3,
  attempts: [
    { attempt: 1, reportId: MOCK_REPORT_IDS.expired, isLatest: false },
    { attempt: 2, reportId: MOCK_REPORT_IDS.noCamera, isLatest: false },
    { attempt: 3, reportId: MOCK_REPORT_IDS.latest, isLatest: true },
  ],

  totalScoreDelta: { fromAttempt: 2, diff: 6 },
  notices: [],

  summary: {
    overview: [
      { key: 'total', label: '총 소요', value: '05:48' },
      { key: 'average', label: '평균 답변', value: '1:27' },
      { key: 'questions', label: '질문 수', value: '4문항' },
      { key: 'style', label: '면접관 스타일', value: '압박형' },
    ],
    // 코멘트는 분석 결과의 문항 번호(`question_number`)로 채웁니다
    turns: [
      { turnId: 1, title: 'Q1 자기소개', status: '안정', startSeconds: 12, endSeconds: 95, score: 82 },
      { turnId: 2, title: 'Q2 지원동기', status: '보통', startSeconds: 105, endSeconds: 190, score: 79 },
      {
        turnId: 3,
        title: 'Q3 직무역량 · 압박 꼬리질문',
        status: '흔들림',
        startSeconds: 200,
        endSeconds: 295,
        score: 71,
      },
      { turnId: 4, title: 'Q4 협업경험', status: '안정', startSeconds: 302, endSeconds: 348, score: 85 },
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

type MockScenario = { shell: ReportShell; analysis: AnalysisResult }

/**
 * 회차별로 다른 상태를 보여줍니다. 연동 전에 화면 분기를 눈으로 확인하는 용도입니다.
 *
 * - 1회차(`expired`) — 영상 링크 만료 (시안 `상태C`) · **개선 답변 예시 없음**.
 *   개선 답변 예시는 명세서 v0.2 에서 P1 이라 백엔드 MVP 에 안 올 수 있습니다. 절과 토글이 둘 다
 *   사라지는지 이 회차로 봅니다 (이슈 #54 3-1)
 * - 2회차(`noCamera`) — 시선 **미사용**(카메라 안 켬) · 회복력 없음(친절형) · 총점 상한 걸림.
 *   미사용뿐이라 `complete` 입니다 — 위쪽 부분 실패 안내는 안 뜨고 시선 줄에만 사유가 남습니다.
 *   카메라를 안 켰으니 **답변 영상도 없습니다**(`video: null`). "만료" 와 "애초에 없음" 은 다른
 *   상태입니다 (이슈 #54 3-4)
 * - 3회차(`latest`) — 시선 **분석 실패** (기본). 목록에 없는 id 도 이 모양으로 돌려줍니다.
 *   분석 중 화면(B-02)이 목업에서 세션 id 로 리포트를 여는 길이 이걸로 이어집니다.
 *   시선을 다시 분석하면 살아납니다 (`reportRetryMock.ts`)
 * - 다른 면접 1회차(`bothFailed`) — **말하기 · 시선 둘 다 실패** · 기업 미선택 · 총평 · 일부 문항 코멘트 생성 실패.
 *   다시 분석의 실패 흐름을 이 회차로 봅니다 (`reportRetryMock.ts`)
 */
const SCENARIOS: Record<string, MockScenario> = {
  [MOCK_REPORT_IDS.latest]: { shell: SAMPLE_SHELL, analysis: SAMPLE_ANALYSIS },

  [MOCK_REPORT_IDS.noCamera]: {
    shell: {
      ...SAMPLE_SHELL,
      reportId: MOCK_REPORT_IDS.noCamera,
      attempt: 2,
      // 회복력이 없는 건 친절형 면접이기 때문입니다. 개요도 같이 맞춰둡니다.
      summary: {
        ...SAMPLE_SHELL.summary,
        overview: SAMPLE_SHELL.summary.overview.map((fact) =>
          fact.key === 'style' ? { ...fact, value: '친절형' } : fact,
        ),
      },
      totalScoreDelta: null,
      // 기본 소제목이 "2회차 대비" 라 2회차 자기 자신과 비교하는 말이 됐습니다.
      metricsComment: '1회차 대비 말하기 속도가 안정됐어요',
      video: null,
    },
    analysis: SKIPPED_ANALYSIS,
  },

  [MOCK_REPORT_IDS.expired]: {
    shell: {
      ...SAMPLE_SHELL,
      reportId: MOCK_REPORT_IDS.expired,
      // 전에는 1회차를 열어도 3회차 칩이 골라지고 "2회차 대비" 가 떴습니다. 첫 회차라 비교 대상이 없습니다.
      attempt: 1,
      totalScoreDelta: null,
      metricsComment: null,
      video: EXPIRED_VIDEO,
      improvedAnswer: null,
      notices: [EXPIRED_NOTICE],
    },
    analysis: SAMPLE_ANALYSIS,
  },

  [MOCK_REPORT_IDS.bothFailed]: {
    shell: {
      ...SAMPLE_SHELL,
      reportId: MOCK_REPORT_IDS.bothFailed,
      sessionId: '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e04',
      companyName: null,
      interviewDate: '2026.07.20',
      attempt: 1,
      attempts: [{ attempt: 1, reportId: MOCK_REPORT_IDS.bothFailed, isLatest: true }],
      totalScoreDelta: null,
      metricsComment: null,
    },
    analysis: BOTH_FAILED_ANALYSIS,
  },
}

/**
 * 다시 분석해서 살아난 축입니다. reportId 별로 기억합니다.
 * 목업이라 메모리에만 둡니다 — 새로고침하면 처음 상태로 돌아갑니다.
 */
const recoveredAxes = new Map<string, Set<RetryAxis>>()

/** 다시 분석이 성공한 축을 기억합니다. 재시도 목업 소켓이 결과를 보낼 때 부릅니다 */
export function recoverMockAxes(reportId: string, axes: RetryAxis[]) {
  const recovered = recoveredAxes.get(reportId) ?? new Set<RetryAxis>()
  axes.forEach((axis) => recovered.add(axis))
  recoveredAxes.set(reportId, recovered)
}

/** 다시 분석해서 살아난 축의 값입니다 */
const RECOVERED_AXIS: Record<RetryAxis, AxisResponse> = {
  speech: {
    status: 'ok',
    score: 76,
    display: 4,
    metrics: { hesitation_score: 35, speech_rate_cv: 0.31, repetition_count: 4 },
    evidence: [],
  },
  gaze: { status: 'ok', score: 74, display: 4, metrics: {}, evidence: [] },
}

const AXIS_KEYS: AxisKey[] = ['content', 'speech', 'gaze']

/**
 * 살아난 축을 분석 결과에 반영합니다. 실제로는 AI 가 리포트 전체를 다시 조립해 보내고 백엔드가 통째로
 * 바꿉니다(AI 계약 14장). 목업은 축 · 상태 · 총점만 바꿉니다.
 *
 * 총점은 AI 가 가중치로 다시 계산합니다. 목업은 그 규칙을 모르므로 **쓰인 축의 평균**으로 둡니다 —
 * 실제 점수와 같을 필요는 없고, 다시 분석한 뒤 총점이 바뀌어 보이는지만 확인하면 됩니다.
 */
function withRecovered(analysis: AnalysisResult, recovered: Set<RetryAxis> | undefined): AnalysisResult {
  if (!recovered || recovered.size === 0) return analysis

  const axes = { ...analysis.axes }
  recovered.forEach((axis) => {
    if (axes[axis].status === 'failed') axes[axis] = RECOVERED_AXIS[axis]
  })

  const used = AXIS_KEYS.filter((key) => axes[key].status === 'ok')
  const failed = AXIS_KEYS.filter((key) => axes[key].status === 'failed')
  const scores = used.map((key) => axes[key].score ?? 0)
  const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length))

  return {
    ...analysis,
    report_status: failed.length > 0 ? 'partial' : 'complete',
    overall: {
      ...analysis.overall,
      score,
      display: Math.min(5, Math.max(1, Math.ceil(score / 20))),
      partial: failed.length > 0,
      axes_used: used,
      axes_failed: failed,
    },
    axes,
  }
}

/** 바깥 부분과 분석 결과를 합쳐 화면용 리포트를 만듭니다. 분석에서 오는 값은 전부 변환 함수를 거칩니다 */
function toMockReport(shell: ReportShell, analysis: AnalysisResult): Report {
  return {
    ...shell,
    status: analysis.report_status,
    totalScore: analysis.overall.score,
    totalScoreDisplay: analysis.overall.display,
    scoreGateReason: toScoreGateReason(analysis.overall),
    // 분석에서 오는 안내(부분 실패)를 먼저, 회차 사정(영상 만료)을 뒤에 둡니다
    notices: [...toPartialNotices(analysis), ...shell.notices],
    summary: {
      ...shell.summary,
      verdict: toVerdict(analysis),
      turns: shell.summary.turns.map((turn) => ({
        ...turn,
        comment: toQuestionComment(analysis, turn.turnId),
      })),
    },
    companyComment: toCompanyComment(analysis),
    metrics: toScoreMetrics(analysis.axes),
    subMetrics: toSubMetrics(analysis),
  }
}

/** 목록에 없는 id 는 3회차 모양으로 돌려줍니다 */
function scenarioOf(reportId: string): MockScenario {
  return SCENARIOS[reportId] ?? SCENARIOS[MOCK_REPORT_IDS.latest]
}

/** 지금 시점의 분석 결과 — 다시 분석해서 살아난 축까지 반영한 것입니다 */
function mockAnalysisOf(reportId: string): AnalysisResult {
  return withRecovered(scenarioOf(reportId).analysis, recoveredAxes.get(reportId))
}

/** 목업 리포트를 만듭니다. 목록에 없는 id 는 3회차 모양에 id 만 바꿔 돌려줍니다. */
export function buildMockReport(reportId: string): Report {
  return toMockReport({ ...scenarioOf(reportId).shell, reportId }, mockAnalysisOf(reportId))
}

/**
 * 리포트의 상태와 총점만 꺼냅니다. 재시도 목업(`reportRetryMock.ts`)이 씁니다.
 *
 * 전에는 상태 하나를 보려고 `buildMockReport` 로 리포트 전체를 변환했습니다. 재시도 등록 · 결과 통지가 보는 건
 * 이 두 값뿐이라 분석 결과에서 바로 읽습니다. (PR #92 리뷰)
 */
export function mockReportState(reportId: string): Pick<Report, 'status' | 'totalScore'> {
  const analysis = mockAnalysisOf(reportId)
  return { status: analysis.report_status, totalScore: analysis.overall.score }
}

registerMock('GET', '/api/reports/:reportId', ({ reportId }) => buildMockReport(reportId), {
  missingInBackend: '리포트 조회 API 없음 (명세서 v0.2 `/v1/reports/{reportId}` 시작 전)',
})
