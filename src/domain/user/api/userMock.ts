import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { JOB_TITLE_MAX_LENGTH, NICKNAME_MAX_LENGTH } from '../lib/profileLimits'
import type { BusinessCard, BusinessCardInput, NotificationSettings } from '../types/user'

/**
 * 로그인한 사용자 목업입니다. 인증 목업(domain/auth/api/authMock.ts)의 사용자와 같은 값을 씁니다 —
 * 로그인 응답의 사용자와 `users/me` 가 다르게 보이면 목업끼리 어긋난 것처럼 보입니다.
 *
 * 닉네임 · 직무는 메모리에 두고 프로필 수정 목업과 같이 씁니다. 새로고침하면 처음 값으로 돌아갑니다.
 */
const me = {
  userId: 'mock-user-1',
  nickname: '목업사용자',
  email: 'mock@example.com',
  providers: ['LOCAL'] as const,
  jobTitle: '프론트엔드 개발자' as string | null,
}

registerMock('GET', '/api/users/me', () => ({ ...me }))

/** 경로와 본문을 프론트가 임시로 정했습니다 (docs/90-open-questions.md Q16) */
const PROFILE_MISSING = '프로필 수정 API 없음 (백엔드 시작 전, Q16)'

registerMock(
  'PATCH',
  '/api/users/me/profile',
  (_params, body) => {
    const input = body as { nickname?: unknown; jobTitle?: unknown } | undefined
    const nickname = typeof input?.nickname === 'string' ? input.nickname.trim() : ''
    const jobTitle = typeof input?.jobTitle === 'string' ? input.jobTitle.trim() : ''

    if (!nickname || nickname.length > NICKNAME_MAX_LENGTH) {
      throw new ApiError('INVALID_REQUEST', `이름은 1~${NICKNAME_MAX_LENGTH}자여야 합니다`)
    }
    if (jobTitle.length > JOB_TITLE_MAX_LENGTH) {
      throw new ApiError('INVALID_REQUEST', `직무는 ${JOB_TITLE_MAX_LENGTH}자까지 적을 수 있습니다`)
    }

    me.nickname = nickname
    me.jobTitle = jobTitle || null
    return { ...me }
  },
  { missingInBackend: PROFILE_MISSING },
)

/**
 * 회원 탈퇴 목업입니다. 백엔드에 탈퇴 API 가 아직 없어서 `users` 를 실제 서버에 붙여도 이 API 만은
 * 목업이 답합니다 (docs/90-open-questions.md Q14). 목업은 아무것도 지우지 않습니다 — 탈퇴 뒤 다시
 * 로그인하면 같은 목업 사용자로 들어옵니다.
 */
registerMock('POST', '/api/users/me/withdrawal', () => undefined, {
  missingInBackend: '회원 탈퇴 API 없음 (백엔드 요청 예정)',
})

/** 알림 설정 목업. 시안의 처음 상태(이메일 켬 · 푸시 끔)입니다 */
const notificationSettings: NotificationSettings = { emailAlerts: true, pushAlerts: false }

/** API 명세서에 없는 임시 경로입니다 (Q16) */
const NOTIFICATION_MISSING = '알림 설정 API 없음 (API 명세서에 없는 임시 경로, Q16)'

registerMock('GET', '/api/users/me/notification-settings', () => ({ ...notificationSettings }), {
  missingInBackend: NOTIFICATION_MISSING,
})

registerMock(
  'PATCH',
  '/api/users/me/notification-settings',
  (_params, body) => {
    const input = body as Partial<NotificationSettings> | undefined
    if (typeof input?.emailAlerts === 'boolean') notificationSettings.emailAlerts = input.emailAlerts
    if (typeof input?.pushAlerts === 'boolean') notificationSettings.pushAlerts = input.pushAlerts
    return { ...notificationSettings }
  },
  { missingInBackend: NOTIFICATION_MISSING },
)

/** 명함 목업. 아직 만들지 않았으면 null 입니다 (B-03 마이페이지/디지털 명함 시안) */
let businessCard: BusinessCard | null = null

function toBusinessCard(input: BusinessCardInput): BusinessCard {
  return { ...input, updatedAt: new Date().toISOString() }
}

function validateBusinessCard(input: BusinessCardInput | undefined): asserts input is BusinessCardInput {
  if (!input?.name?.trim()) throw new ApiError('INVALID_REQUEST', '이름을 입력해 주세요')
  if (!input.companyName?.trim()) throw new ApiError('INVALID_REQUEST', '기업명을 입력해 주세요')
}

/** 명세서 경로 그대로지만 백엔드가 아직 시작 전입니다 (Q16) */
const BUSINESS_CARD_MISSING = '명함 API 없음 (명세서 경로는 있지만 백엔드 시작 전, Q16)'

registerMock('GET', '/api/users/me/business-card', () => businessCard, {
  missingInBackend: BUSINESS_CARD_MISSING,
})

registerMock(
  'POST',
  '/api/users/me/business-card',
  (_params, body) => {
    const input = body as BusinessCardInput | undefined
    validateBusinessCard(input)
    businessCard = toBusinessCard(input)
    return businessCard
  },
  { missingInBackend: BUSINESS_CARD_MISSING },
)

registerMock(
  'PATCH',
  '/api/users/me/business-card',
  (_params, body) => {
    const input = body as BusinessCardInput | undefined
    validateBusinessCard(input)
    businessCard = toBusinessCard(input)
    return businessCard
  },
  { missingInBackend: BUSINESS_CARD_MISSING },
)
