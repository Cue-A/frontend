import { ApiError } from '@/shared/api/apiError'
import { registerMock } from '@/shared/api/mock'

import { JOB_TITLE_MAX_LENGTH, NICKNAME_MAX_LENGTH } from '../lib/profileLimits'
import type { CareerLevel, NotificationSettings, Profile } from '../types/user'

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

/* 프로필 · 계정 정보 · 탈퇴는 백엔드에 들어왔습니다(Cue-A/backend#64 · #126 · #128). `users` 를 켜면 실제 서버로 갑니다 */

registerMock('GET', '/api/users/me/profile', () => ({ ...profile }))

const CAREER_LEVELS: CareerLevel[] = ['student', 'entry', 'junior', 'experienced']

/**
 * 프로필 수정 목업. 서버처럼 **보낸 칸만** 고치고, 아무것도 안 보내면 400 `INVALID_REQUEST` 입니다.
 * 서버는 `null` 을 "안 보냄" 으로 봐서 칸을 지우지 않습니다. 글 칸은 빈 문자열(`''`)을 보내야 지워지고, 서버에는 `''` 로 남습니다.
 * 화면이 쓰는 이름 · 직무만 길이를 검사하고, 나머지 칸은 서버의 값 제약만 봅니다.
 */
registerMock(
  'PATCH',
  '/api/users/me/profile',
  (_params, body) => {
    const input = (body ?? {}) as Partial<Record<keyof Profile, unknown>>
    // 서버처럼 null 은 보내지 않은 것으로 봅니다
    const keys = Object.keys(input).filter((key) => input[key as keyof Profile] != null)
    if (keys.length === 0) throw new ApiError('INVALID_REQUEST', '수정할 프로필 정보가 없습니다')

    if (input.userName != null) {
      const userName = typeof input.userName === 'string' ? input.userName.trim() : ''
      if (!userName || userName.length > NICKNAME_MAX_LENGTH) {
        throw new ApiError('INVALID_REQUEST', `이름은 1~${NICKNAME_MAX_LENGTH}자여야 합니다`)
      }
      profile.userName = userName
      me.nickname = userName
    }
    if (input.targetJobRole != null) {
      const job = typeof input.targetJobRole === 'string' ? input.targetJobRole : ''
      if (job.length > JOB_TITLE_MAX_LENGTH) {
        throw new ApiError('INVALID_REQUEST', `직무는 ${JOB_TITLE_MAX_LENGTH}자까지 적을 수 있습니다`)
      }
      // 서버처럼 빈 문자열을 그대로 둡니다. 화면은 조회에서 `''` 를 비어 있는 것으로 봅니다 (userApi `toProfile`)
      profile.targetJobRole = job
    }
    if (input.careerLevel != null) {
      if (!CAREER_LEVELS.includes(input.careerLevel as CareerLevel)) {
        throw new ApiError('INVALID_REQUEST', '허용되지 않은 careerLevel 값입니다')
      }
      profile.careerLevel = input.careerLevel as CareerLevel
    }
    // 프로필 사진은 이 API 로 바뀌지 않습니다 (서버도 받지 않음)
    for (const key of ['introduction', 'schoolName', 'major'] as const) {
      const value = input[key]
      if (typeof value === 'string') profile[key] = value
    }
    if (typeof input.graduationYear === 'number') profile.graduationYear = input.graduationYear

    return { ...profile }
  },
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
)

/**
 * 회원 탈퇴 목업입니다 (`DELETE /api/users/me`, 본문 없음). 목업은 아무것도 지우지 않습니다 — 탈퇴 뒤 다시
 * 로그인하면 같은 목업 사용자로 들어옵니다.
 */
registerMock('DELETE', '/api/users/me', () => undefined)

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
