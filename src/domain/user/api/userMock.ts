import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { JOB_TITLE_MAX_LENGTH, NICKNAME_MAX_LENGTH } from '../lib/profileLimits'
import type { BusinessCard, BusinessCardInput, CareerLevel, NotificationSettings, Profile } from '../types/user'

/**
 * 로그인한 사용자 목업입니다. 인증 목업(domain/auth/api/authMock.ts)의 사용자와 같은 값을 씁니다 —
 * 로그인 응답의 사용자와 `users/me` 가 다르게 보이면 목업끼리 어긋난 것처럼 보입니다.
 *
 * 닉네임은 프로필 수정 목업이 이름(`userName`)을 바꾸면 같이 바뀝니다. 새로고침하면 처음 값으로 돌아갑니다.
 */
const me = {
  userId: 'mock-user-1',
  nickname: '목업사용자',
  email: 'mock@example.com',
  providers: ['LOCAL'] as const,
}

registerMock('GET', '/api/users/me', () => ({ ...me }))

/** 내 프로필 목업. 처음에는 직무만 채워 둡니다 (프로필을 한 번도 저장하지 않으면 나머지는 null) */
const profile: Profile = {
  userId: me.userId,
  userName: me.nickname,
  email: me.email,
  profileImageUrl: null,
  introduction: null,
  targetJobRole: '프론트엔드 개발자',
  careerLevel: null,
  schoolName: null,
  major: null,
  graduationYear: null,
}

/** 명세서는 받았지만 백엔드가 아직 시작 전입니다 (docs/90-open-questions.md Q16) */
const PROFILE_MISSING = '프로필 · 계정 정보 API 없음 (명세서 "시작 전", Q16)'

registerMock('GET', '/api/users/me/profile', () => ({ ...profile }), { missingInBackend: PROFILE_MISSING })

const CAREER_LEVELS: CareerLevel[] = ['student', 'entry', 'junior', 'experienced']

/**
 * 프로필 수정 목업. 명세처럼 **보낸 칸만** 고치고, 아무것도 안 보내면 `EMPTY_UPDATE_REQUEST` 입니다.
 * 화면이 쓰는 이름 · 직무만 길이를 검사하고, 나머지 칸은 명세의 값 제약만 봅니다.
 */
registerMock(
  'PATCH',
  '/api/users/me/profile',
  (_params, body) => {
    const input = (body ?? {}) as Partial<Record<keyof Profile, unknown>>
    const keys = Object.keys(input).filter((key) => input[key as keyof Profile] !== undefined)
    if (keys.length === 0) throw new ApiError('EMPTY_UPDATE_REQUEST', '수정할 프로필 정보가 없습니다.')

    if (input.userName !== undefined) {
      const userName = typeof input.userName === 'string' ? input.userName.trim() : ''
      if (!userName || userName.length > NICKNAME_MAX_LENGTH) {
        throw new ApiError('INVALID_REQUEST', `이름은 1~${NICKNAME_MAX_LENGTH}자여야 합니다`)
      }
      profile.userName = userName
      me.nickname = userName
    }
    if (input.targetJobRole !== undefined) {
      const job = typeof input.targetJobRole === 'string' ? input.targetJobRole.trim() : ''
      if (job.length > JOB_TITLE_MAX_LENGTH) {
        throw new ApiError('INVALID_REQUEST', `직무는 ${JOB_TITLE_MAX_LENGTH}자까지 적을 수 있습니다`)
      }
      profile.targetJobRole = job || null
    }
    if (input.careerLevel !== undefined) {
      if (input.careerLevel !== null && !CAREER_LEVELS.includes(input.careerLevel as CareerLevel)) {
        throw new ApiError('INVALID_REQUEST', '경력 단계가 올바르지 않습니다')
      }
      profile.careerLevel = input.careerLevel as CareerLevel | null
    }
    for (const key of ['profileImageUrl', 'introduction', 'schoolName', 'major'] as const) {
      const value = input[key]
      if (value !== undefined) profile[key] = typeof value === 'string' && value ? value : null
    }
    if (input.graduationYear !== undefined) {
      profile.graduationYear = typeof input.graduationYear === 'number' ? input.graduationYear : null
    }

    return { ...profile }
  },
  { missingInBackend: PROFILE_MISSING },
)

/** 계정 정보 목업. 이메일로 가입한 계정입니다 */
registerMock(
  'GET',
  '/api/users/me/account',
  () => ({
    email: me.email,
    createdAt: '2026-09-01T10:00:00',
    auths: [{ provider: 'LOCAL', hasPassword: true, linkedAt: '2026-09-01T10:00:00' }],
  }),
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
