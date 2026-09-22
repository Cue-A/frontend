/**
 * AI 분석 결과의 응답 모양과, 그걸 화면용 타입으로 바꾸는 함수입니다.
 * (AI 파트 "프론트 전달 문서" 2장 · 이슈 #46)
 *
 * 필드 이름은 AI 저장소의 `ai/report_schemas.py`(계약서 원본:
 * `docs/리포트생성_API계약_백엔드전달용.md`)에서 그대로 옮겼습니다.
 *
 * **한 가지 어긋난 게 있습니다.** AI 는 시선 축을 `gaze` 로 부르는데 백엔드
 * 엔티티(`Report.java`)는 `score_vision` 입니다. 백엔드가 어느 이름으로
 * 내보낼지 정해지면 이 파일만 고치면 됩니다. (이슈 #32 5번)
 *
 * 리포트를 감싸는 바깥 응답(회사명 · 회차 · 영상)은 백엔드가 만드는 부분이고
 * 조회 엔드포인트가 아직 없습니다. 그래서 이 파일은 **분석 결과 부분만** 다룹니다.
 */

import type { Evidence, ScoreMetric, SubMetric } from '../types/report'

/** 점수 축. 전달 문서의 "점수 항목" 세 줄입니다. */
export type AxisKey = 'content' | 'speech' | 'gaze'

export type EvidenceResponse = {
  question_id: string
  /** 해당 답변 오디오 기준 초 (소수 1자리) */
  t_start: number
  t_end: number
  kind: 'strength' | 'weakness'
  label: string
  comment: string
}

/**
 * 축 하나의 결과입니다.
 *
 * `error_code` 와 `reason` 은 **조건부 키**입니다. `status` 가 `'ok'` 인 축에는
 * `null` 이 아니라 키 자체가 없습니다. `axis.error_code` 를 먼저 읽으면 `undefined`
 * 라서, 반드시 `status` 를 보고 나서 읽어야 합니다.
 *
 * `score` · `display` · `metrics` 는 반대로 키가 항상 있고 실패 · 미사용일 때 `null`
 * 로 옵니다. null 검사만 하면 됩니다.
 */
export type AxisResponse = {
  status: 'ok' | 'failed' | 'skipped'
  /** 0~100 */
  score: number | null
  /** 1~5 */
  display: number | null
  /**
   * 축의 하위 지표입니다.
   *
   * **말하기 축만 확정됐습니다** — `hesitation_score`(0~100, 클수록 많이
   * 머뭇거림) · `speech_rate_cv`(발화 속도 변동 계수) · `repetition_count`
   * (인접 반복 횟수). 화면에 쓰는 건 `hesitation_score` 하나고 나머지 둘은
   * 원인 파악용입니다.
   *
   * 내용 · 시선 축은 아직 **빈 객체**입니다. 비어 있는 게 오류가 아닙니다.
   * 키가 나중에 추가되더라도 기존 필드는 바뀌지 않는다고 계약에 적혀 있습니다.
   *
   * 계약서에 **필러워드("음", "어")는 세지 않는다**고 명시돼 있습니다.
   * Whisper 가 비유창성을 지우도록 학습돼서 안정적으로 안 잡히기 때문입니다.
   * 대신 침묵 · 속도 변동 · 인접 반복을 묶어 "머뭇거림" 하나로 나옵니다.
   */
  metrics: Record<string, number> | null
  evidence: EvidenceResponse[]
  /** `status` 가 `'failed'` 일 때만 있습니다 */
  error_code?: string
  /** `status` 가 `'skipped'` 일 때만 있습니다. 예) `'no_video'` */
  reason?: string
}

export type AnalysisOverall = {
  /** 0~100 */
  score: number
  /** 1~5 */
  display: number
  gated: boolean
  /** `gated` 가 true 일 때만 값이 있습니다. 예) `'content_relevance_low'` */
  gate_reason: string | null
  partial: boolean
  axes_used: AxisKey[]
  axes_failed: AxisKey[]
}

/**
 * 회복력입니다. 숫자 하나가 아니라 객체로 옵니다.
 *
 * **친절형 면접에서는 항상 null 입니다.** 압박 구간이 없어 회복을 잴 대상이
 * 없기 때문입니다.
 */
export type ResilienceResponse = {
  /** 0~100 */
  score: number
  /** 1~5 */
  display: number
  comment: string
}

export type AnalysisResult = {
  report_status: 'complete' | 'partial'
  overall: AnalysisOverall
  axes: Record<AxisKey, AxisResponse>
  resilience: ResilienceResponse | null
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

function toEvidence(item: EvidenceResponse): Evidence {
  return {
    questionId: item.question_id,
    startSeconds: item.t_start,
    endSeconds: item.t_end,
    kind: item.kind,
    label: item.label,
    comment: item.comment,
  }
}

/** 축 하나가 왜 점수가 없는지 화면에 적을 문구. 정상이면 null 입니다. */
function toUnavailableLabel(axis: AxisResponse): string | null {
  if (axis.status === 'ok') return null
  if (axis.status === 'failed') return FAILED_MESSAGE

  return SKIP_REASON_MESSAGE[axis.reason ?? ''] ?? SKIP_FALLBACK
}

/** 세부 점수 세 줄을 만듭니다. */
export function toScoreMetrics(axes: Record<AxisKey, AxisResponse>): ScoreMetric[] {
  return AXIS_ORDER.map((key) => {
    const axis = axes[key]

    return {
      key,
      label: AXIS_LABEL[key],
      status: axis.status,
      score: axis.score,
      display: axis.display,
      unavailableLabel: toUnavailableLabel(axis),
      evidence: axis.evidence.map(toEvidence),
    }
  })
}

/**
 * 회복력 카드를 만듭니다. 없으면 null 이고, **목록에서 빼야 합니다.**
 * 친절형 면접은 압박 구간이 없어 잴 대상 자체가 없습니다.
 *
 * 설명 문구는 서버가 주는 `comment` 를 그대로 씁니다. 회차마다 다른 말이 오고,
 * 프론트가 점수만 보고 지어낸 문장보다 정확합니다.
 */
export function toResilienceMetric(resilience: ResilienceResponse | null): SubMetric | null {
  if (resilience === null) return null

  return {
    key: 'resilience',
    label: '회복력',
    value: `${resilience.score} / 100`,
    description: resilience.comment,
  }
}

/**
 * 머뭇거림 카드를 만듭니다. 말하기 축의 `hesitation_score` 가 출처입니다.
 *
 * 값이 클수록 많이 머뭇거린 것이라, 점수가 높을수록 좋은 다른 지표와 방향이
 * 반대입니다. 그래서 숫자만 두지 않고 설명에 방향을 적습니다.
 *
 * 말하기 축이 실패했거나 아직 `metrics` 가 비어 있으면 null 입니다. 빈 값을
 * 0으로 그리면 "전혀 안 머뭇거렸다" 로 읽혀서 사실과 반대가 됩니다.
 */
export function toHesitationMetric(speech: AxisResponse): SubMetric | null {
  const score = speech.metrics?.hesitation_score
  if (score === undefined) return null

  return {
    key: 'hesitation',
    label: '머뭇거림',
    value: `${score} / 100`,
    description: '침묵 · 말 속도 변동 · 같은 말 반복을 묶은 값이에요. 낮을수록 매끄럽습니다.',
  }
}

/** 총점 상한 안내 문구. 안 걸렸으면 null 입니다. */
export function toScoreGateReason(overall: AnalysisOverall): string | null {
  if (!overall.gated) return null

  return GATE_REASON_MESSAGE[overall.gate_reason ?? ''] ?? GATE_FALLBACK
}

/**
 * 리포트 위에 띄울 안내입니다.
 *
 * 어떤 축이 왜 빠졌는지까지 적습니다. "일부 항목이 빠졌다" 만으로는 어느 점수를
 * 덜 믿어야 하는지 알 수 없습니다.
 */
export function toPartialNotices(result: AnalysisResult): string[] {
  if (!result.overall.partial) return []

  const missing = AXIS_ORDER.filter((key) => result.axes[key].status !== 'ok').map((key) => {
    const axis = result.axes[key]
    return `${AXIS_LABEL[key]}(${toUnavailableLabel(axis)})`
  })

  return [
    `일부 항목이 빠진 결과예요. ${missing.join(' · ')} — 총점은 남은 항목으로만 계산됐습니다.`,
  ]
}
