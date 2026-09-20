/**
 * AI 분석 결과의 응답 모양과, 그걸 화면용 타입으로 바꾸는 함수입니다.
 * (AI 파트 "프론트 전달 문서" 2장 · 이슈 #46)
 *
 * 여기 적힌 필드 이름은 **AI 가 보내는 이름**입니다. 전달 문서에 "Spring 이 자체
 * 이름으로 바꿔 내보낼 수 있다" 고 적혀 있어서, 실제 응답 필드는 백엔드와 맞춰봐야
 * 합니다. 바뀌더라도 이 파일 하나만 고치면 화면은 그대로입니다. (이슈 #32 5번)
 *
 * 리포트 전체 응답(회사명 · 회차 · 영상 · 개선 답변)은 AI 가 아니라 백엔드가 만드는
 * 부분이라 아직 계약이 없습니다. 그래서 이 파일은 **분석 결과 부분만** 다룹니다.
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
  /** 축의 하위 지표. 말하기라면 속도 · 필러 · 침묵 · 마무리 */
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

export type AnalysisResult = {
  report_status: 'complete' | 'partial'
  overall: AnalysisOverall
  axes: Record<AxisKey, AxisResponse>
  /** 회복력 점수. 친절형 면접에서는 항상 null 입니다 */
  resilience: number | null
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
 * 친절형 면접은 압박 구간이 없어 잴 대상이 자체가 없습니다.
 */
export function toResilienceMetric(resilience: number | null): SubMetric | null {
  if (resilience === null) return null

  return {
    key: 'resilience',
    label: '회복력',
    value: `${resilience}%`,
    description: '압박 질문 이후 답변 안정도를 얼마나 빨리 되찾았는지예요.',
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
