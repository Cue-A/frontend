/**
 * 리포트 상세 조회 응답의 모양과, 그걸 화면용 타입(`Report`)으로 바꾸는 함수입니다.
 * (Cue-A/backend#66 `ReportDetailResponse` · 노션 "리포트 상세 조회")
 *
 * 응답은 AI 리포트 계약 13장의 결과를 백엔드가 **camelCase 로 옮긴 것**에 질문 원문(`questionText`)을 붙인
 * 모양입니다. 백엔드는 AI 가 준 문자열(`status` · `kind` …)을 enum 으로 바꾸지 않고 그대로 넘깁니다. 그래서
 * 여기 타입도 `string` 으로 받고, 모르는 값은 변환하면서 걸러냅니다.
 *
 * **응답에 없어서 화면이 정한 값으로 채우는 것들입니다.** 백엔드에 값이 생기면 이 파일만 고치면 됩니다.
 *
 * | 화면 값 | 지금 채우는 값 | 이유 |
 * | --- | --- | --- |
 * | 회사명 · 직무 (`companyName` · `jobRole`) | null — 머리말과 소제목에서 빠집니다 | 응답에 없음 |
 * | 회차 · 회차 칩 (`attempt` · `attempts`) | 1 · 빈 목록 — 칩 줄이 안 보입니다 | 응답에 없음 |
 * | 지난 회차 대비 (`totalScoreDelta`) | null — 안 그립니다 | 응답에 없음 |
 * | 세부 점수 소제목 (`metricsComment`) | null — 안 그립니다 | 응답에 없음 |
 * | 답변 영상 (`video`) | null — 절이 안 보입니다 | 재생 주소 API 없음 |
 * | 면접 흐름 · 잘한 점 시각 | null | 근거 시각은 **답변 오디오 기준**이라 영상 위치가 아닙니다 |
 * | 면접 흐름 상태 (`안정` · `보통` · `흔들림`) | 문항 점수로 나눕니다 (80 · 60) | 응답에 없음 |
 * | 한 줄 총평 · 문항 코멘트 (`summary` · `questions[].comment`) | 오면 쓰고, 없으면 그 칸만 비웁니다 | 노션 명세에는 있는데 백엔드 응답(main)에 아직 없음 |
 */

import type {
  Evidence,
  Highlight,
  ImprovedAnswer,
  OverviewFact,
  Report,
  RetryAxis,
  RetryState,
  ScoreMetric,
  SubMetric,
  TurnFlow,
} from '../types/report'
import type { MetricStatus } from '../types/report'

/** 점수 축. 리포트 계약의 "점수 항목" 세 줄입니다. */
export type AxisKey = 'content' | 'speech' | 'gaze'

export type EvidenceResponse = {
  questionId: string
  /** 그 답변 오디오 기준 초 (소수 1자리). **영상 기준이 아닙니다** */
  tStart: number | null
  tEnd: number | null
  /** `strength` | `weakness` */
  kind: string
  /** 배지용 짧은 이름. 예) '근거 부족' */
  label: string
  comment: string
}

/**
 * 축 하나의 결과입니다.
 *
 * `errorCode` 는 `failed` 일 때만, `reason` 은 `skipped` 일 때만 값이 있습니다. 나머지 경우엔 null 입니다.
 * (AI 원본은 키 자체가 없지만, 백엔드가 record 로 옮기면서 null 로 채웁니다)
 */
export type AxisResponse = {
  /** `ok` | `failed` | `skipped`. skipped 는 카메라 미사용이라 실패가 아닙니다 */
  status: string
  /** `SPEECH_FAILED` · `GAZE_FAILED` */
  errorCode: string | null
  /** `no_video` */
  reason: string | null
  /** 0~100. failed · skipped 면 null */
  score: number | null
  /** 1~5. failed · skipped 면 null */
  display: number | null
  /**
   * 축별 지표입니다. 키 이름만 camelCase 로 바뀌어 옵니다.
   * 말하기는 `hesitationScore` · `speechRateCv` · `repetitionCount`, 내용 · 시선은 지금 빈 객체입니다.
   * failed · skipped 면 null 입니다.
   */
  metrics: Record<string, unknown> | null
  evidence: EvidenceResponse[]
}

export type OverallResponse = {
  /** 0~100. 상한(게이트)까지 적용된 최종값 */
  score: number | null
  /** 1~5 */
  display: number | null
  gated: boolean
  /** `gated` 일 때만. 지금은 `content_relevance_low` */
  gateReason: string | null
  /** 말하기 · 시선 중 실패한 축이 있는지. 카메라 미사용은 실패가 아닙니다 */
  partial: boolean
  axesUsed: string[]
  axesFailed: string[]
}

/** 회복력. **친절형이거나 꼬리질문이 없으면 null** 입니다 */
export type ResilienceResponse = {
  score: number | null
  display: number | null
  comment: string | null
}

/** 문항 하나의 결과입니다. 되묻기는 따로 나오지 않고 원 질문에 합쳐집니다(`hadReask`). */
export type QuestionResultResponse = {
  questionId: string
  /** 질문 원문. AI 결과에 없어 백엔드가 붙입니다. 찾지 못하면 null */
  questionText: string | null
  /** 1부터 셉니다 */
  questionNumber: number
  category: string | null
  difficulty: string | null
  isReplay: boolean
  isSpareTopic: boolean
  /** 0~100 */
  score: number | null
  /** 1~5 */
  display: number | null
  /** 문항별 축 점수. 실패 · 미사용 축은 null */
  axes: Record<AxisKey, number | null>
  transcript: string | null
  /** 답변 길이(초) */
  durationSec: number | null
  wordCount: number | null
  /** true 면 감점 없이 "시간 초과로 중단됨" 으로 표시합니다 */
  wasTimeout: boolean
  hadReask: boolean
  /**
   * 문항 한 줄 코멘트입니다. **노션 명세에는 있지만 지금 백엔드 응답에는 없습니다.**
   * 오면 쓰고, 없거나 생성에 실패(null)하면 그 줄만 코멘트 없이 둡니다.
   */
  comment?: string | null
}

export type ImprovedAnswerResponse = {
  questionId: string
  /** 전사에 실제로 있는 구절 */
  originalExcerpt: string
  suggestion: string
  tStart: number | null
  tEnd: number | null
}

/**
 * 실패 축 재시도 상태입니다. (Cue-A/backend#68 `ReportRetryInfo`)
 * 재시도한 적이 없거나 재시도가 성공해 결과가 바뀌었으면 응답의 `retry` 가 null 입니다.
 * 상세 조회 · 상태 조회 · 재시도 접수 응답에 같은 모양으로 들어갑니다.
 */
export type ReportRetryInfoResponse = {
  /** `PROCESSING`(다시 분석 중) | `FAILED`(마지막 재시도 실패). 실패해도 리포트는 원래 결과 그대로입니다 */
  status: string
  /** 다시 분석하는 축. 리포트의 `overall.axesFailed` 와 같습니다 */
  axes: string[]
  /** `FAILED` 일 때만 */
  errorCode: string | null
  /** `FAILED` 일 때만. 소켓 `error.message` 와 같은 문구입니다 */
  message: string | null
  /** `FAILED` 일 때만. true 면 다시 눌러 볼 만합니다 */
  retryable: boolean | null
}

export type ReportDetailResponse = {
  reportId: string
  sessionId: string
  status: 'COMPLETED' | 'PARTIAL'
  overall: OverallResponse
  axes: Record<AxisKey, AxisResponse | null>
  questions: QuestionResultResponse[]
  resilience: ResilienceResponse | null
  /** 인재상 기준 코멘트. 기업을 고르지 않았거나 생성에 실패하면 null */
  companyComment: string | null
  /** 내용 점수가 낮은 문항 최대 2개. 없으면 빈 배열 */
  improvedAnswers: ImprovedAnswerResponse[]
  retry: ReportRetryInfoResponse | null
  /** AI 가 리포트를 만든 시각 (ISO 8601) */
  generatedAt: string | null
  /** 최초 분석 요청 시각 — 면접을 마친 시각과 거의 같습니다 */
  createdAt: string
  completedAt: string | null
  /**
   * 한 줄 총평입니다. **노션 명세에는 있지만 지금 백엔드 응답에는 없습니다.**
   * 오면 쓰고, 없거나 생성에 실패(null)하면 총평 칸만 그리지 않습니다.
   */
  summary?: string | null
}

/** 화면에 쓰는 축 이름입니다. */
const AXIS_LABEL: Record<AxisKey, string> = {
  content: '내용',
  speech: '말하기',
  gaze: '시선',
}

/** 축 순서. 시안의 세부 점수 순서와 같습니다. */
const AXIS_ORDER: AxisKey[] = ['content', 'speech', 'gaze']

/**
 * 축을 쓰지 않은 이유를 사용자 말로 바꿉니다.
 *
 * 모르는 이유가 와도 "분석 실패" 로 떨어뜨리지 않습니다. 미사용은 실패가 아니고,
 * 실패로 적으면 사용자가 서비스 오류로 오해합니다.
 */
const SKIP_REASON_MESSAGE: Record<string, string> = {
  no_video: '카메라를 사용하지 않았습니다',
}

const SKIP_FALLBACK = '이번 회차에서는 측정하지 않았습니다'

const FAILED_MESSAGE = '분석 실패'

/**
 * 총점 상한이 걸린 이유를 사용자 말로 바꿉니다.
 * 코드를 그대로 보여주면 읽는 사람이 없습니다.
 */
const GATE_REASON_MESSAGE: Record<string, string> = {
  content_relevance_low:
    '답변이 질문에서 벗어난 구간이 있어서예요. 말하기와 시선 점수가 좋아도 내용이 질문과 이어지지 않으면 총점이 제한됩니다.',
}

const GATE_FALLBACK = '내용 평가 결과에 따라 상한이 적용됐어요.'

/**
 * 축 상태를 화면 값으로 옮깁니다. 모르는 값이면 점수가 있는지로 정합니다 —
 * 점수가 있으면 정상, 없으면 실패로 봅니다. 없는 점수를 그리는 것보다 비워 두는 편이 낫습니다.
 */
function toMetricStatus(axis: AxisResponse): MetricStatus {
  if (axis.status === 'ok' || axis.status === 'failed' || axis.status === 'skipped') return axis.status
  return axis.score === null ? 'failed' : 'ok'
}

/** 축이 통째로 빠져 왔을 때 씁니다. 실패로 적으면 사용자가 서비스 오류로 읽어서 "측정 안 함" 으로 둡니다 */
const MISSING_AXIS: AxisResponse = {
  status: 'skipped',
  errorCode: null,
  reason: null,
  score: null,
  display: null,
  metrics: null,
  evidence: [],
}

function axisOf(detail: ReportDetailResponse, key: AxisKey): AxisResponse {
  return detail.axes?.[key] ?? MISSING_AXIS
}

/** 근거 한 건. 모르는 `kind` 나 시각이 빠진 건은 버립니다 */
function toEvidence(item: EvidenceResponse): Evidence | null {
  if (item.kind !== 'strength' && item.kind !== 'weakness') return null
  if (item.tStart === null || item.tEnd === null) return null

  return {
    questionId: item.questionId,
    startSeconds: item.tStart,
    endSeconds: item.tEnd,
    kind: item.kind,
    label: item.label,
    comment: item.comment,
  }
}

/** 축 하나가 왜 점수가 없는지 화면에 적을 문구. 정상이면 null 입니다. */
function toUnavailableLabel(axis: AxisResponse): string | null {
  const status = toMetricStatus(axis)
  if (status === 'ok') return null
  if (status === 'failed') return FAILED_MESSAGE

  return SKIP_REASON_MESSAGE[axis.reason ?? ''] ?? SKIP_FALLBACK
}

/**
 * 실패한 축만 다시 분석할 수 있는 축입니다. 내용은 빠집니다 — 내용이 실패하면 리포트가 아예 없습니다.
 * (`RetryAxis` 주석 참고)
 */
const RETRY_AXES: readonly AxisKey[] = ['speech', 'gaze']

function isRetryAxis(key: AxisKey): key is RetryAxis {
  return RETRY_AXES.includes(key)
}

/** 실패한 축이면 다시 분석할 축 이름을, 아니면 null 을 돌려줍니다. 미사용(`skipped`)은 다시 돌려도 같아서 null 입니다 */
function toRetryAxis(key: AxisKey, axis: AxisResponse): RetryAxis | null {
  return toMetricStatus(axis) === 'failed' && isRetryAxis(key) ? key : null
}

/**
 * 재시도 상태를 화면 값으로 옮깁니다. 재시도한 적이 없거나 성공했으면 null 입니다.
 *
 * 새로고침하거나 다른 탭에서 연 화면이 **도는 중인 재시도를 이어 기다리고**, 마지막 재시도가 실패했다는 걸
 * 알려주는 데 씁니다. 모르는 상태 값이면 null 로 둡니다 — 없는 재시도를 기다리게 하는 것보다 버튼을 보여주는
 * 편이 낫고, 눌렀을 때 이미 도는 중이면 서버가 `REPORT_RETRY_IN_PROGRESS` 로 알려줍니다.
 */
export function toRetryState(retry: ReportRetryInfoResponse | null): RetryState | null {
  if (!retry) return null

  const axes = retry.axes.filter((axis): axis is RetryAxis => isRetryAxis(axis as AxisKey))
  if (retry.status === 'PROCESSING') {
    return { status: 'processing', axes, errorCode: null, message: null, retryable: true }
  }
  if (retry.status === 'FAILED') {
    return {
      status: 'failed',
      axes,
      errorCode: retry.errorCode,
      message: toText(retry.message),
      retryable: retry.retryable ?? false,
    }
  }
  return null
}

/** 세부 점수 세 줄을 만듭니다. */
function toScoreMetrics(detail: ReportDetailResponse): ScoreMetric[] {
  return AXIS_ORDER.map((key) => {
    const axis = axisOf(detail, key)

    return {
      key,
      label: AXIS_LABEL[key],
      status: toMetricStatus(axis),
      score: axis.score,
      display: axis.display,
      unavailableLabel: toUnavailableLabel(axis),
      retryAxis: toRetryAxis(key, axis),
      evidence: (axis.evidence ?? []).map(toEvidence).filter((item): item is Evidence => item !== null),
    }
  })
}

/**
 * AI 가 쓴 글을 화면에 넣을 값으로 바꿉니다. 비었거나 공백뿐이면 null 입니다.
 *
 * 생성 실패는 계약상 null 로 오지만, 빈 문자열이 와도 빈 칸을 그리지 않게 같이 막습니다.
 */
function toText(value: string | null | undefined): string | null {
  const text = value?.trim()
  return text ? text : null
}

/**
 * 회복력 카드를 만듭니다. 없으면 null 이고, **목록에서 빼야 합니다.**
 * 친절형 면접은 압박 구간이 없어 잴 대상 자체가 없습니다.
 *
 * 설명 문구는 서버가 주는 `comment` 를 그대로 씁니다. 회차마다 다른 말이 오고,
 * 프론트가 점수만 보고 지어낸 문장보다 정확합니다.
 */
function toResilienceMetric(resilience: ResilienceResponse | null): SubMetric | null {
  if (resilience === null || resilience.score === null) return null

  return {
    key: 'resilience',
    label: '회복력',
    value: `${resilience.score} / 100`,
    description: toText(resilience.comment) ?? '압박 질문 뒤에 답변 흐름을 얼마나 되찾았는지 본 값이에요.',
  }
}

/**
 * 머뭇거림 카드를 만듭니다. 말하기 축의 `hesitationScore` 가 출처입니다.
 *
 * 값이 클수록 많이 머뭇거린 것이라, 점수가 높을수록 좋은 다른 지표와 방향이
 * 반대입니다. 그래서 숫자만 두지 않고 설명에 방향을 적습니다.
 *
 * 말하기 축이 실패했거나 `metrics` 에 값이 없으면 null 입니다. 빈 값을
 * 0으로 그리면 "전혀 안 머뭇거렸다" 로 읽혀서 사실과 반대가 됩니다.
 */
function toHesitationMetric(speech: AxisResponse): SubMetric | null {
  const score = speech.metrics?.hesitationScore
  if (typeof score !== 'number') return null

  return {
    key: 'hesitation',
    label: '머뭇거림',
    value: `${Math.round(score)} / 100`,
    description: '침묵 · 말 속도 변동 · 같은 말 반복을 묶은 값이에요. 낮을수록 매끄럽습니다.',
  }
}

/** 값이 있는 보조 지표만 모읍니다. 없는 지표는 자리도 만들지 않습니다. */
function toSubMetrics(detail: ReportDetailResponse): SubMetric[] {
  return [toResilienceMetric(detail.resilience), toHesitationMetric(axisOf(detail, 'speech'))].filter(
    (item): item is SubMetric => item !== null,
  )
}

/** 총점 상한 안내 문구. 안 걸렸으면 null 입니다. */
function toScoreGateReason(overall: OverallResponse): string | null {
  if (!overall.gated) return null

  return GATE_REASON_MESSAGE[overall.gateReason ?? ''] ?? GATE_FALLBACK
}

/**
 * 리포트 위에 띄울 안내입니다.
 *
 * 어떤 축이 왜 빠졌는지까지 적습니다. "일부 항목이 빠졌다" 만으로는 어느 점수를
 * 덜 믿어야 하는지 알 수 없습니다.
 *
 * 실패한 축이 있으면 다시 분석할 곳도 알려줍니다. 버튼은 세부 점수의 그 줄에 있습니다 —
 * 안내만 보고 지나가면 다시 분석할 수 있다는 걸 모릅니다.
 */
function toPartialNotices(detail: ReportDetailResponse): string[] {
  if (!detail.overall.partial) return []

  const missing = AXIS_ORDER.filter((key) => toMetricStatus(axisOf(detail, key)) !== 'ok').map(
    (key) => `${AXIS_LABEL[key]}(${toUnavailableLabel(axisOf(detail, key))})`,
  )

  const canRetry = AXIS_ORDER.some((key) => toRetryAxis(key, axisOf(detail, key)) !== null)
  const retryHint = canRetry ? ' 아래 세부 점수에서 빠진 항목만 다시 분석할 수 있어요.' : ''

  return [
    `일부 항목이 빠진 결과예요. ${missing.join(' · ')} — 총점은 남은 항목으로만 계산됐습니다.${retryHint}`,
  ]
}

/** 문항을 번호 순으로 둡니다. 응답 순서에 기대지 않습니다 */
function sortedQuestions(detail: ReportDetailResponse): QuestionResultResponse[] {
  return [...(detail.questions ?? [])].sort((a, b) => a.questionNumber - b.questionNumber)
}

/** 'Q1 자기소개를 해 주세요' — 원문을 못 찾았으면 번호만 둡니다 */
function toTurnTitle(question: QuestionResultResponse): string {
  const text = toText(question.questionText)
  return text ? `Q${question.questionNumber} ${text}` : `Q${question.questionNumber}`
}

/** 상태 라벨을 나누는 문항 점수 기준입니다. 응답에 상태 값이 없어 화면이 정합니다 */
const TURN_STABLE_SCORE = 80
const TURN_NORMAL_SCORE = 60

/**
 * 면접 흐름의 상태 라벨입니다.
 *
 * 시간이 다 돼 끊긴 문항은 점수와 관계없이 "시간 초과" 로 둡니다. 계약상 감점하지 않고 그렇게
 * 표시하라고 돼 있습니다. 점수가 없으면 라벨도 달지 않습니다 — 없는 판정을 지어내지 않습니다.
 */
function toTurnStatus(question: QuestionResultResponse): string | null {
  if (question.wasTimeout) return '시간 초과'
  if (question.score === null) return null
  if (question.score >= TURN_STABLE_SCORE) return '안정'
  if (question.score >= TURN_NORMAL_SCORE) return '보통'
  return '흔들림'
}

function toTurns(questions: QuestionResultResponse[]): TurnFlow[] {
  return questions.map((question) => ({
    turnId: question.questionNumber,
    title: toTurnTitle(question),
    comment: toText(question.comment),
    status: toTurnStatus(question),
    // 영상 기준 시각은 응답에 없습니다. 근거의 tStart 는 답변 오디오 기준이라 여기 쓰면 위치가 틀립니다
    startSeconds: null,
    endSeconds: null,
    score: question.score,
  }))
}

/** 83 → '1:23' */
function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * 면접 개요 칸입니다. 문항별 답변 길이(`durationSec`)를 더하고 나눠 씁니다.
 *
 * 시안의 "총 소요" 는 면접 전체 시간인데 응답에는 답변 길이만 있어서, 이름을 "총 답변 시간" 으로 바꿨습니다.
 * 질문을 듣는 시간이 빠져 실제 소요보다 짧기 때문입니다. "면접관 스타일" 칸은 응답에 없어서 뺐습니다.
 */
function toOverview(questions: QuestionResultResponse[]): OverviewFact[] {
  const durations = questions
    .map((question) => question.durationSec)
    .filter((value): value is number => typeof value === 'number')

  const facts: OverviewFact[] = []

  if (durations.length > 0) {
    const total = durations.reduce((sum, value) => sum + value, 0)
    facts.push(
      { key: 'total', label: '총 답변 시간', value: formatDuration(total) },
      { key: 'average', label: '평균 답변', value: formatDuration(total / durations.length) },
    )
  }

  facts.push({ key: 'questions', label: '질문 수', value: `${questions.length}문항` })
  return facts
}

/** 잘한 점 · 아쉬운 점은 각각 이만큼만 보여줍니다. 시안이 두세 줄입니다 */
const MAX_HIGHLIGHTS = 3

/**
 * 잘한 점 · 아쉬운 점입니다. 세 축의 근거(`evidence`)에서 그 종류만 모읍니다.
 *
 * 응답에 따로 목록이 없어서 근거를 씁니다. 문장은 `comment` 를 쓰고, 비었으면 배지 이름(`label`)으로 둡니다.
 * 시각은 답변 오디오 기준이라 영상 위치로 쓸 수 없어서 null 입니다.
 */
function toHighlights(detail: ReportDetailResponse, kind: 'strength' | 'weakness'): Highlight[] {
  const texts = AXIS_ORDER.flatMap((key) => axisOf(detail, key).evidence ?? [])
    .filter((item) => item.kind === kind)
    .map((item) => toText(item.comment) ?? toText(item.label))
    .filter((text): text is string => text !== null)

  return [...new Set(texts)]
    .slice(0, MAX_HIGHLIGHTS)
    .map((text) => ({ text, startSeconds: null, endSeconds: null }))
}

/**
 * 개선 답변 예시입니다. 화면은 한 문항만 보여주므로 첫 번째 것을 씁니다.
 * 백엔드는 내용 점수가 낮은 문항을 최대 2개 보내고, 없으면 빈 배열입니다 — 그때는 절이 사라집니다.
 */
function toImprovedAnswer(detail: ReportDetailResponse, questions: QuestionResultResponse[]): ImprovedAnswer | null {
  const first = (detail.improvedAnswers ?? []).find(
    (item) => toText(item.originalExcerpt) !== null && toText(item.suggestion) !== null,
  )
  if (!first) return null

  const question = questions.find((item) => item.questionId === first.questionId)

  return {
    turnTitle: question ? toTurnTitle(question) : '개선이 필요한 답변',
    myAnswer: first.originalExcerpt.trim(),
    example: first.suggestion.trim(),
  }
}

/** ISO 시각 → 'YYYY.MM.DD' (보는 사람의 시간대 기준). 읽지 못하면 빈 문자열입니다 */
function toInterviewDate(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}.${mm}.${dd}`
}

/** 리포트 상세 응답을 화면용 리포트로 바꿉니다. 응답에 없는 값은 이 파일 맨 위 표대로 채웁니다 */
export function toReport(detail: ReportDetailResponse): Report {
  const questions = sortedQuestions(detail)

  return {
    reportId: detail.reportId,
    sessionId: detail.sessionId,
    status: detail.status === 'PARTIAL' ? 'partial' : 'complete',
    companyName: null,
    jobRole: null,
    interviewDate: toInterviewDate(detail.createdAt),
    questionCount: questions.length,

    attempt: 1,
    attempts: [],

    totalScore: detail.overall.score,
    totalScoreDisplay: detail.overall.display,
    totalScoreDelta: null,
    scoreGateReason: toScoreGateReason(detail.overall),
    notices: toPartialNotices(detail),

    summary: {
      verdict: toText(detail.summary),
      overview: toOverview(questions),
      turns: toTurns(questions),
      strengths: toHighlights(detail, 'strength'),
      weaknesses: toHighlights(detail, 'weakness'),
    },

    companyComment: toText(detail.companyComment),

    metrics: toScoreMetrics(detail),
    subMetrics: toSubMetrics(detail),
    metricsComment: null,

    improvedAnswer: toImprovedAnswer(detail, questions),
    video: null,
    retry: toRetryState(detail.retry),
  }
}
