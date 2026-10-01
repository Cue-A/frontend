import {
  DELIVERY_MODES,
  INTERVIEWER_STYLES,
  QUESTION_COUNT_CHOICES,
  type DeliveryMode,
  type InterviewerStyle,
  type SelectedResume,
  type SessionSetup,
} from '../types/sessionSetup'

type Fields = Record<string, unknown>

function isFields(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value))
}

function isResume(value: unknown): value is SelectedResume | null {
  if (value === null) return true
  if (!isFields(value)) return false
  return (
    typeof value.documentId === 'string' &&
    typeof value.title === 'string' &&
    isStringOrNull(value.fileName) &&
    isNumberOrNull(value.fileSize)
  )
}

function isInterviewerStyle(value: unknown): value is InterviewerStyle | null {
  return value === null || INTERVIEWER_STYLES.some((choice) => choice.value === value)
}

function isDeliveryMode(value: unknown): value is DeliveryMode {
  return DELIVERY_MODES.some((choice) => choice.value === value)
}

function isQuestionCount(value: unknown): value is number {
  return QUESTION_COUNT_CHOICES.some((choice) => Number(choice.value) === value)
}

/**
 * 이 탭에 남겨 둔 옵션 설정(useSessionSetup)을 꺼낼 때 모양을 확인합니다. 하나라도 어긋나면 null 입니다.
 *
 * 저장소의 값은 코드가 바뀌기 전에 저장된 것일 수 있습니다. 예를 들어 직무가 고르는 칩이던 때 값이 남아 있으면
 * 화면이 엉뚱한 값을 그립니다. 반쯤 맞는 값을 살리려 하지 않고 통째로 버리고 처음 값으로 시작합니다.
 */
export function parseSavedSessionSetup(value: unknown): SessionSetup | null {
  if (!isFields(value)) return null

  const {
    jobRole,
    resume,
    useCompanyQuestion,
    companyId,
    customCulture,
    answerSeconds,
    questionCount,
    interviewerStyle,
    deliveryMode,
  } = value

  if (
    typeof jobRole !== 'string' ||
    !isResume(resume) ||
    typeof useCompanyQuestion !== 'boolean' ||
    !isStringOrNull(companyId) ||
    typeof customCulture !== 'string' ||
    !isNumberOrNull(answerSeconds) ||
    !isQuestionCount(questionCount) ||
    !isInterviewerStyle(interviewerStyle) ||
    !isDeliveryMode(deliveryMode)
  ) {
    return null
  }

  return {
    jobRole,
    resume,
    useCompanyQuestion,
    companyId,
    customCulture,
    answerSeconds,
    questionCount,
    interviewerStyle,
    deliveryMode,
  }
}
