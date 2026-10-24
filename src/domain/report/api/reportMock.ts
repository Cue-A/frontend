import { registerMock } from '@/shared/api/mock'

import type { RetryAxis } from '../types/report'

import type {
  AxisKey,
  AxisResponse,
  EvidenceResponse,
  QuestionResultResponse,
  ReportDetailResponse,
  ReportRetryInfoResponse,
} from './reportResponse'

/**
 * 리포트 상세 조회 목업입니다. **백엔드 응답 모양(`ReportDetailResponse`) 그대로** 돌려줍니다.
 *
 * 화면용 모양으로 미리 다듬어두면 변환 함수(`toReport`)가 한 번도 안 돌아서, 실제 응답이 왔을 때
 * 처음 돌아가게 됩니다. 목업이라도 서버가 주는 모양으로 두면 변환층을 같이 검증합니다.
 *
 * 한 줄 총평(`summary`)과 문항 코멘트(`questions[].comment`)는 노션 명세에만 있고 **지금 백엔드 응답에는
 * 없습니다.** 목업은 명세대로 넣어 두고, `noExtras` 회차만 지금 백엔드처럼 두 값을 뺐습니다.
 */

/** 문항 원문입니다. 실제로는 백엔드가 면접 질문에서 찾아 붙입니다(`questionText`) */
const QUESTION_TEXTS = [
  '자기소개를 1분 안에 해 주세요.',
  '이 직무에 지원한 동기는 무엇인가요?',
  '데이터 분석 프로젝트에서 그 모델을 고른 이유를 설명해 주세요.',
  '팀원과 의견이 달랐던 경험을 말해 주세요.',
]

/** 문항별 한 줄 코멘트입니다. 값은 C-01 시안의 "면접 흐름" 문구를 그대로 옮겼습니다. */
const QUESTION_COMMENTS = [
  '두괄식으로 정리해 도입이 매끄러웠습니다',
  '근거는 충분했지만 한 문장이 길어졌습니다',
  '8초 침묵 후 답변이 추상적으로 흘렀습니다',
  '사례가 구체적이어서 톤을 회복했습니다',
]

/** 문항 점수. 3번은 '흔들림'(60 미만), 2번은 '보통', 나머지는 '안정' 으로 보이게 골랐습니다 */
const QUESTION_SCORES = [82, 79, 58, 85]

/** 답변 길이(초). 개요의 "총 답변 시간 5:09 · 평균 답변 1:17" 이 이 값에서 나옵니다 */
const QUESTION_DURATIONS = [83, 85, 95, 46]

function toDisplay(score: number) {
  return Math.min(5, Math.max(1, Math.ceil(score / 20)))
}

type QuestionOptions = {
  /** 문항 축 점수. 리포트의 축 상태와 맞춥니다 — 실패 · 미사용 축은 문항에서도 null 입니다 */
  axes: (score: number) => Record<AxisKey, number | null>
  /** 코멘트를 넣을지. `none` 이면 키 자체를 뺍니다(지금 백엔드 응답처럼) */
  comments: 'all' | 'some' | 'none'
  /** 시간이 다 돼 끊긴 문항 번호 */
  timeoutNumber?: number
}

/** 문항 네 개를 만듭니다. 화면이 쓰지 않는 값(전사 · 단어 수 …)은 그럴듯하게 채웁니다 */
function toQuestions({ axes, comments, timeoutNumber }: QuestionOptions): QuestionResultResponse[] {
  return QUESTION_SCORES.map((score, index) => {
    const number = index + 1
    const question: QuestionResultResponse = {
      questionId: `q${number}`,
      questionText: QUESTION_TEXTS[index],
      questionNumber: number,
      category: null,
      difficulty: null,
      isReplay: false,
      isSpareTopic: false,
      score,
      display: toDisplay(score),
      axes: axes(score),
      transcript: '',
      durationSec: QUESTION_DURATIONS[index],
      wordCount: 120,
      wasTimeout: number === timeoutNumber,
      hadReask: false,
    }

    if (comments === 'all') question.comment = QUESTION_COMMENTS[index]
    // 생성에 실패한 문항은 null 로 옵니다. 2번 · 4번만 실패로 둡니다
    if (comments === 'some') question.comment = index % 2 === 0 ? QUESTION_COMMENTS[index] : null

    return question
  })
}

/** 잘한 점 · 아쉬운 점의 출처가 되는 근거들입니다. 시각은 답변 오디오 기준 초입니다 */
const CONTENT_EVIDENCE: EvidenceResponse[] = [
  {
    questionId: 'q1',
    tStart: 1.2,
    tEnd: 15.8,
    kind: 'strength',
    label: '두괄식',
    comment: '결론을 먼저 말하는 구조로 답했습니다.',
  },
  {
    questionId: 'q4',
    tStart: 12,
    tEnd: 30.4,
    kind: 'strength',
    label: '구체적 사례',
    comment: '경험을 수치와 함께 제시했습니다.',
  },
  {
    questionId: 'q3',
    tStart: 8,
    tEnd: 16.4,
    kind: 'weakness',
    label: '근거 부족',
    comment: '선택 이유를 설명했으나 비교 대상이 제시되지 않았습니다.',
  },
]

const SPEECH_EVIDENCE: EvidenceResponse[] = [
  {
    questionId: 'q3',
    tStart: 0,
    tEnd: 8,
    kind: 'weakness',
    label: '침묵',
    comment: '예상 밖 질문에서 8초 동안 말이 멈췄습니다.',
  },
]

const CONTENT_OK: AxisResponse = {
  status: 'ok',
  errorCode: null,
  reason: null,
  score: 84,
  display: 4,
  // 내용 축 metrics 는 계약서에서 아직 빈 객체입니다. 비어 있는 게 오류가 아닙니다.
  metrics: {},
  evidence: CONTENT_EVIDENCE,
}

const SPEECH_OK: AxisResponse = {
  status: 'ok',
  errorCode: null,
  reason: null,
  score: 78,
  display: 4,
  // 말하기 축만 키가 확정됐습니다. 백엔드가 키 이름을 camelCase 로 바꿔 보냅니다
  metrics: { hesitationScore: 32, speechRateCv: 0.284, repetitionCount: 3 },
  evidence: SPEECH_EVIDENCE,
}

function failedAxis(errorCode: string): AxisResponse {
  return { status: 'failed', errorCode, reason: null, score: null, display: null, metrics: null, evidence: [] }
}

const GAZE_SKIPPED: AxisResponse = {
  status: 'skipped',
  errorCode: null,
  reason: 'no_video',
  score: null,
  display: null,
  metrics: null,
  evidence: [],
}

/** 개선 답변 예시. 백엔드는 내용 점수가 낮은 문항을 최대 2개 보냅니다. 화면은 첫 번째만 씁니다 */
const IMPROVED_ANSWERS: ReportDetailResponse['improvedAnswers'] = [
  {
    questionId: 'q3',
    originalExcerpt:
      '저는 데이터 분석 프로젝트에서 전처리를 담당했고 어… 랜덤 포레스트를 사용해서 성능을 좀 올렸습니다.',
    suggestion:
      '이탈률 예측 프로젝트에서 전처리를 맡아, 결측 구간을 재정의해 학습 데이터를 12% 늘렸습니다. 그 결과 모델 F1이 0.71에서 0.78로 개선됐습니다.',
    tStart: 8,
    tEnd: 21.5,
  },
]

// AI 프롬프트대로 "인재상에서 드러난 것 + 더 보여주면 좋을 것" 1~2문장입니다 (ai/report_writer.py)
const COMPANY_COMMENT =
  '인재상에서 강조하는 협업 경험은 Q4 사례로 잘 드러났어요. 스스로 문제를 정의한 과정을 Q3 같은 직무 질문에서 더 보여주면 좋겠어요.'

/**
 * 목업 리포트 id 입니다.
 *
 * 실제 `reportId` 는 **UUID 문자열**입니다. `Report` 엔티티가 정수 PK 와 별도로 `public_id` 를
 * 들고 있고, 바깥에는 그것만 나갑니다 (이슈 #54 3-2). 목업도 같은 모양으로 둬야 짧은 id 에 기대는
 * 코드가 연동 날 깨지지 않습니다.
 */
export const MOCK_REPORT_IDS = {
  noExtras: 'b1f0c6a2-7d3e-4a51-9c28-5e1f0a7b3c01',
  noCamera: 'b1f0c6a2-7d3e-4a51-9c28-5e1f0a7b3c02',
  latest: 'b1f0c6a2-7d3e-4a51-9c28-5e1f0a7b3c03',
  bothFailed: 'b1f0c6a2-7d3e-4a51-9c28-5e1f0a7b3c04',
} as const

/**
 * 시선 분석이 **실패한** 회차입니다(기본). 시안과 같은 상태이고, 리포트에서 제일 자주 겪을 상황입니다.
 * 시선을 다시 분석하면 살아납니다 (`reportRetryMock.ts`).
 */
const LATEST: ReportDetailResponse = {
  reportId: MOCK_REPORT_IDS.latest,
  sessionId: '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e03',
  status: 'PARTIAL',
  summary:
    '자기소개와 협업 경험은 안정적으로 풀었지만, 3번 꼬리질문에서 흐름이 한 번 끊겼습니다. 끊긴 뒤 다시 페이스를 찾는 데 40초가 걸렸어요.',
  overall: {
    score: 82,
    display: 4,
    gated: false,
    gateReason: null,
    partial: true,
    axesUsed: ['content', 'speech'],
    axesFailed: ['gaze'],
  },
  axes: { content: CONTENT_OK, speech: SPEECH_OK, gaze: failedAxis('GAZE_FAILED') },
  questions: toQuestions({
    axes: (score) => ({ content: score + 2, speech: score - 4, gaze: null }),
    comments: 'all',
  }),
  resilience: { score: 58, display: 3, comment: '압박 질문 이후 답변 길이가 절반으로 줄었습니다.' },
  companyComment: COMPANY_COMMENT,
  improvedAnswers: IMPROVED_ANSWERS,
  retry: null,
  generatedAt: '2026-07-18T14:23:10+09:00',
  createdAt: '2026-07-18T14:21:40+09:00',
  completedAt: '2026-07-18T14:23:12+09:00',
}

/**
 * 시선을 **안 쓴** 회차입니다. 실패(`failed`)와 미사용(`skipped`)이 화면에서 다르게 보이는지 확인하려고 둡니다.
 * 친절형 면접이라 회복력도 없고, 총점에 상한이 걸린 경우와 시간 초과 문항(4번)까지 한 번에 볼 수 있습니다.
 *
 * **미사용은 `PARTIAL` 이 아닙니다.** `axesFailed` 는 `status == 'failed'` 인 축만 담고, `partial` 도 그 목록이
 * 비었는지로 정해집니다. 카메라만 안 켠 회차는 `COMPLETED` · `partial: false` 로 옵니다. 그래서 위쪽 부분 실패
 * 안내는 안 뜨고 시선 줄에만 사유가 남습니다. 다시 분석 버튼도 없습니다 — 다시 돌려도 결과가 같습니다.
 */
const NO_CAMERA: ReportDetailResponse = {
  ...LATEST,
  reportId: MOCK_REPORT_IDS.noCamera,
  sessionId: '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e02',
  status: 'COMPLETED',
  summary: '말하기 속도는 안정됐지만, 답변이 질문에서 벗어난 구간이 있어 내용 점수가 낮게 나왔습니다.',
  overall: {
    score: 40,
    display: 2,
    gated: true,
    gateReason: 'content_relevance_low',
    partial: false,
    axesUsed: ['content', 'speech'],
    axesFailed: [],
  },
  axes: {
    content: { ...CONTENT_OK, score: 38, display: 2, evidence: CONTENT_EVIDENCE.slice(2) },
    speech: {
      ...SPEECH_OK,
      score: 72,
      metrics: { hesitationScore: 54, speechRateCv: 0.41, repetitionCount: 6 },
      evidence: [],
    },
    gaze: GAZE_SKIPPED,
  },
  questions: toQuestions({
    axes: (score) => ({ content: score - 40, speech: score - 8, gaze: null }),
    comments: 'all',
    timeoutNumber: 4,
  }),
  resilience: null,
  createdAt: '2026-07-16T19:02:00+09:00',
}

/** 한 줄 총평 키를 뺀 사본입니다. null 이 아니라 키가 없는 모양입니다 */
function withoutSummary(detail: ReportDetailResponse): ReportDetailResponse {
  const copy = { ...detail }
  delete copy.summary
  return copy
}

/**
 * **지금 백엔드 응답 그대로**인 회차입니다. 한 줄 총평 · 문항 코멘트 키가 없고, 개선 답변 예시도 빈 배열입니다.
 * 총평 칸 · 흐름의 코멘트 줄 · 개선 답변 절과 토글이 모두 사라지는지 이 회차로 봅니다.
 */
const NO_EXTRAS: ReportDetailResponse = {
  ...withoutSummary(LATEST),
  reportId: MOCK_REPORT_IDS.noExtras,
  sessionId: '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e01',
  questions: toQuestions({
    axes: (score) => ({ content: score + 2, speech: score - 4, gaze: null }),
    comments: 'none',
  }),
  improvedAnswers: [],
  createdAt: '2026-07-14T10:30:00+09:00',
}

/**
 * **말하기와 시선이 둘 다 실패한** 회차입니다. 기업을 고르지 않은 면접이기도 합니다.
 *
 * AI 가 쓰는 글이 실패했을 때(null) 화면이 어떻게 되는지도 이 회차로 봅니다.
 * - 한 줄 총평(`summary`) — null. 총평 칸을 그리지 않습니다
 * - 문항 코멘트(`questions[].comment`) — 2번 · 4번만 null. 그 줄만 코멘트 없이 제목만 남습니다
 * - 인재상 코멘트(`companyComment`) — 기업 미선택이라 null. 인재상 칸을 그리지 않습니다
 *
 * 내용만 남아서 총점도 내용 점수로만 계산된 값입니다. 다시 분석의 실패 흐름을 이 회차로 봅니다 (`reportRetryMock.ts`)
 */
const BOTH_FAILED: ReportDetailResponse = {
  ...LATEST,
  reportId: MOCK_REPORT_IDS.bothFailed,
  sessionId: '8d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e04',
  summary: null,
  overall: {
    score: 84,
    display: 4,
    gated: false,
    gateReason: null,
    partial: true,
    axesUsed: ['content'],
    axesFailed: ['speech', 'gaze'],
  },
  axes: { content: CONTENT_OK, speech: failedAxis('SPEECH_FAILED'), gaze: failedAxis('GAZE_FAILED') },
  questions: toQuestions({
    axes: (score) => ({ content: score + 2, speech: null, gaze: null }),
    comments: 'some',
  }),
  companyComment: null,
  createdAt: '2026-07-20T16:45:00+09:00',
}

/**
 * 리포트별로 다른 상태를 보여줍니다. 연동 전에 화면 분기를 눈으로 확인하는 용도입니다.
 * 목록에 없는 id 는 `latest` 모양에 id 만 바꿔 돌려줍니다 — 분석 중 화면(B-02)이 목업에서 여는 리포트가 이것입니다.
 */
const SCENARIOS: Record<string, ReportDetailResponse> = {
  [MOCK_REPORT_IDS.latest]: LATEST,
  [MOCK_REPORT_IDS.noCamera]: NO_CAMERA,
  [MOCK_REPORT_IDS.noExtras]: NO_EXTRAS,
  [MOCK_REPORT_IDS.bothFailed]: BOTH_FAILED,
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
    ...SPEECH_OK,
    score: 76,
    metrics: { hesitationScore: 35, speechRateCv: 0.31, repetitionCount: 4 },
    evidence: [],
  },
  gaze: { status: 'ok', errorCode: null, reason: null, score: 74, display: 4, metrics: {}, evidence: [] },
}

const AXIS_KEYS: AxisKey[] = ['content', 'speech', 'gaze']

/**
 * 살아난 축을 리포트에 반영합니다. 실제로는 AI 가 리포트 전체를 다시 조립해 보내고 백엔드가 통째로
 * 바꿉니다(AI 계약 14장). 목업은 축 · 상태 · 총점만 바꿉니다.
 *
 * 총점은 AI 가 가중치로 다시 계산합니다. 목업은 그 규칙을 모르므로 **쓰인 축의 평균**으로 둡니다 —
 * 실제 점수와 같을 필요는 없고, 다시 분석한 뒤 총점이 바뀌어 보이는지만 확인하면 됩니다.
 */
function withRecovered(detail: ReportDetailResponse, recovered: Set<RetryAxis> | undefined): ReportDetailResponse {
  if (!recovered || recovered.size === 0) return detail

  const axes = { ...detail.axes }
  recovered.forEach((axis) => {
    if (axes[axis]?.status === 'failed') axes[axis] = RECOVERED_AXIS[axis]
  })

  const used = AXIS_KEYS.filter((key) => axes[key]?.status === 'ok')
  const failed = AXIS_KEYS.filter((key) => axes[key]?.status === 'failed')
  const scores = used.map((key) => axes[key]?.score ?? 0)
  const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length))

  return {
    ...detail,
    status: failed.length > 0 ? 'PARTIAL' : 'COMPLETED',
    overall: {
      ...detail.overall,
      score,
      display: toDisplay(score),
      partial: failed.length > 0,
      axesUsed: used,
      axesFailed: failed,
    },
    axes,
  }
}

/**
 * 리포트별 재시도 상태(`retry`)입니다. 재시도 목업이 접수 · 실패 때 채우고, 성공하면 지웁니다 — 실제 서버도
 * 성공하면 `retry` 가 null 입니다. 메모리에만 둡니다.
 */
const retryInfos = new Map<string, ReportRetryInfoResponse>()

/** 재시도 상태를 바꿉니다. null 이면 지웁니다 (`reportRetryMock.ts`) */
export function setMockRetry(reportId: string, info: ReportRetryInfoResponse | null) {
  if (info) retryInfos.set(reportId, info)
  else retryInfos.delete(reportId)
}

/** 지금 시점의 상세 응답 — 다시 분석해서 살아난 축 · 재시도 상태까지 반영한 것입니다. 목록에 없는 id 는 `latest` 모양입니다 */
function mockDetailOf(reportId: string): ReportDetailResponse {
  const base = SCENARIOS[reportId] ?? { ...LATEST, reportId }
  return { ...withRecovered(base, recoveredAxes.get(reportId)), retry: retryInfos.get(reportId) ?? null }
}

/**
 * 재시도 목업(`reportRetryMock.ts`)이 보는 값만 꺼냅니다 — 리포트 상태 · 총점 · 실패한 축 · 재시도 상태.
 * 실제 서버처럼 리포트가 `PARTIAL` 인지, 이미 도는 중인지, 어느 축을 다시 돌릴지를 이걸로 정합니다.
 */
export function mockRetryTarget(reportId: string) {
  const detail = mockDetailOf(reportId)
  return {
    status: detail.status,
    totalScore: detail.overall.score ?? 0,
    axesFailed: detail.overall.axesFailed.filter((axis): axis is RetryAxis => axis === 'speech' || axis === 'gaze'),
    retry: detail.retry,
  }
}

registerMock('GET', '/api/reports/:reportId', ({ reportId }) => mockDetailOf(reportId))
