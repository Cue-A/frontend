import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import type { BusinessCard, BusinessCardInput, CompanyInterest, NotificationSettings } from '../types/user'

/**
 * 로그인한 사용자 목업입니다. 인증 목업(domain/auth/api/authMock.ts)의 사용자와 같은 값을 씁니다 —
 * 로그인 응답의 사용자와 `users/me` 가 다르게 보이면 목업끼리 어긋난 것처럼 보입니다.
 *
 * nickname · email · jobTitle 은 메모리에 저장해서 프로필 수정 목업과 같이 씁니다.
 */
const me = {
  userId: 'mock-user-1',
  nickname: '목업사용자',
  email: 'mock@example.com',
  providers: ['LOCAL'] as const,
  jobTitle: '프론트엔드 개발자' as string | null,
}

registerMock('GET', '/api/users/me', () => ({ ...me }))

registerMock('PATCH', '/users/me/profile', (_params, body) => {
  const input = body as { nickname?: unknown; email?: unknown; jobTitle?: unknown } | undefined

  if (typeof input?.nickname !== 'string' || !input.nickname.trim()) {
    throw new ApiError('INVALID_REQUEST', '이름을 입력해 주세요')
  }
  if (typeof input.email !== 'string' || !input.email.trim()) {
    throw new ApiError('INVALID_REQUEST', '이메일을 입력해 주세요')
  }

  me.nickname = input.nickname.trim()
  me.email = input.email.trim()
  me.jobTitle = typeof input.jobTitle === 'string' && input.jobTitle.trim() ? input.jobTitle.trim() : null

  return { ...me }
})

/**
 * 회원 탈퇴 목업입니다. 백엔드에 탈퇴 API 가 아직 없어서 `users` 를 실제 서버에 붙여도 이 API 만은
 * 목업이 답합니다 (docs/90-open-questions.md Q14). 목업은 아무것도 지우지 않습니다 — 탈퇴 뒤 다시
 * 로그인하면 같은 목업 사용자로 들어옵니다.
 */
registerMock('POST', '/api/users/me/withdrawal', () => undefined, {
  missingInBackend: '회원 탈퇴 API 없음 (백엔드 요청 예정)',
})

/** 관심 기업 목업. B-03 마이페이지/관심기업 시안의 초기 셋입니다. */
const companyInterests: CompanyInterest[] = [
  { companyId: 'naver', name: '네이버', tagline: '도전과 몰입을 중시하는 인재' },
  { companyId: 'kakao', name: '카카오', tagline: '수평적 소통, 문제해결력 강조' },
  { companyId: 'samsung', name: '삼성전자', tagline: '창의·혁신, 글로벌 역량 중시' },
]

registerMock('GET', '/v1/users/me/company-interests', () => [...companyInterests])

registerMock('PUT', '/v1/users/me/company-interests/:companyId', ({ companyId }) => {
  if (!companyInterests.some((item) => item.companyId === companyId)) {
    // 목업이라 이름 모를 기업은 id 를 그대로 이름 삼아 더합니다.
    companyInterests.push({ companyId, name: companyId, tagline: '' })
  }
  return undefined
})

registerMock('DELETE', '/v1/users/me/company-interests/:companyId', ({ companyId }) => {
  const index = companyInterests.findIndex((item) => item.companyId === companyId)
  if (index >= 0) companyInterests.splice(index, 1)
  return undefined
})

/** 알림 설정 목업. 명세서에 없는 임시 경로입니다 (userApi.ts 주석 참고). */
const notificationSettings: NotificationSettings = { emailAlerts: true, pushAlerts: false }

registerMock('GET', '/api/users/me/notification-settings', () => ({ ...notificationSettings }))

registerMock('PATCH', '/api/users/me/notification-settings', (_params, body) => {
  const input = body as Partial<NotificationSettings> | undefined
  if (typeof input?.emailAlerts === 'boolean') notificationSettings.emailAlerts = input.emailAlerts
  if (typeof input?.pushAlerts === 'boolean') notificationSettings.pushAlerts = input.pushAlerts
  return { ...notificationSettings }
})

/** 디지털 명함 목업. 아직 만들지 않았으면 null 입니다 (B-03 마이페이지/디지털 명함 시안). */
let businessCard: BusinessCard | null = null

function toBusinessCard(input: BusinessCardInput): BusinessCard {
  return { ...input, updatedAt: new Date().toISOString() }
}

function validateBusinessCard(input: BusinessCardInput | undefined): asserts input is BusinessCardInput {
  if (!input?.name?.trim()) throw new ApiError('INVALID_REQUEST', '이름을 입력해 주세요')
  if (!input.companyName?.trim()) throw new ApiError('INVALID_REQUEST', '기업명을 입력해 주세요')
}

registerMock('GET', '/api/users/me/business-card', () => businessCard)

registerMock('POST', '/api/users/me/business-card', (_params, body) => {
  const input = body as BusinessCardInput | undefined
  validateBusinessCard(input)
  businessCard = toBusinessCard(input)
  return businessCard
})

registerMock('PATCH', '/api/users/me/business-card', (_params, body) => {
  const input = body as BusinessCardInput | undefined
  validateBusinessCard(input)
  businessCard = toBusinessCard(input)
  return businessCard
})
