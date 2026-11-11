import { api } from '@/shared/api/apiClient'

import type {
  AccountInfo,
  CareerLevel,
  LoginProvider,
  Me,
  NotificationSettings,
  Profile,
  ProfileUpdateInput,
} from '../types/user'

import './userMock'

/** `PATCH /api/users/me/email` 응답 (Cue-A/backend `EmailChangeResponse`) */
type EmailChangeResponse = {
  email: string
}

/** 서버 응답 모양 (Cue-A/backend `UserResponse`). 화면 타입과 같지만 변환 자리를 둡니다. */
type UserResponse = {
  userId: string
  nickname: string
  email: string | null
  providers: LoginProvider[]
}

/**
 * 로그인한 사용자. `GET /api/users/me`
 *
 * 로그인이 필요합니다. 토큰 없이 부르면 `UNAUTHORIZED` 입니다.
 * `VITE_REAL_APIS` 이름은 `users` 입니다.
 */
export async function getMe(): Promise<Me> {
  const response = await api.get<UserResponse>('/api/users/me')
  return {
    userId: response.userId,
    nickname: response.nickname,
    email: response.email,
    providers: response.providers,
  }
}

/** 프로필 응답 (Cue-A/backend#128 `ProfileResponse`). 화면 타입(`Profile`)과 칸은 같지만 빈 문자열을 정리하는 자리를 둡니다 */
type ProfileResponse = {
  userId: string
  userName: string
  email: string | null
  profileImageUrl: string | null
  introduction: string | null
  targetJobRole: string | null
  /** 서버는 문자열로 줍니다. 허용값(student · entry · junior · experienced)이 아니면 비어 있는 것으로 봅니다 */
  careerLevel: string | null
  schoolName: string | null
  major: string | null
  graduationYear: number | null
}

const CAREER_LEVELS: readonly CareerLevel[] = ['student', 'entry', 'junior', 'experienced']

function toCareerLevel(value: string | null): CareerLevel | null {
  return CAREER_LEVELS.find((level) => level === value) ?? null
}

/** 지울 때 빈 문자열을 보내서 조회에 `''` 가 남습니다. 화면은 비어 있는 칸을 null 하나로만 봅니다 */
function emptyToNull(value: string | null) {
  return value === null || value.trim() === '' ? null : value
}

function toProfile(response: ProfileResponse): Profile {
  return {
    userId: response.userId,
    userName: response.userName,
    email: response.email,
    profileImageUrl: response.profileImageUrl,
    introduction: emptyToNull(response.introduction),
    targetJobRole: emptyToNull(response.targetJobRole),
    schoolName: emptyToNull(response.schoolName),
    major: emptyToNull(response.major),
    careerLevel: toCareerLevel(response.careerLevel),
    graduationYear: response.graduationYear,
  }
}

/**
 * 내 프로필. `GET /api/users/me/profile` (Cue-A/backend#128)
 *
 * 프로필을 한 번도 저장하지 않은 사용자는 이름 · 이메일 말고 전부 null 입니다.
 */
export async function getProfile() {
  return toProfile(await api.get<ProfileResponse>('/api/users/me/profile'))
}

/**
 * 프로필 수정. `PATCH /api/users/me/profile` (Cue-A/backend#128)
 *
 * **바꾼 칸만 보냅니다.** 빈 본문은 400 `INVALID_REQUEST` 라, 화면이 바뀐 게 없으면 부르지 않습니다.
 * 서버는 `null` 을 "안 보냄" 으로 봐서, 칸을 지울 때는 빈 문자열을 보냅니다(`ProfileUpdateInput`).
 * 고친 뒤의 프로필 전체를 돌려받습니다.
 */
export async function updateProfile(input: ProfileUpdateInput) {
  return toProfile(await api.patch<ProfileResponse>('/api/users/me/profile', input))
}

/**
 * 계정 정보. `GET /api/users/me/account` (Cue-A/backend#126)
 *
 * 이메일 · 가입일 · 로그인 수단별 연결일과 비밀번호 유무입니다. 비밀번호 원문 · 카카오 회원번호는 오지 않습니다.
 * 시각은 시간대 없는 값(`2026-09-01T10:00:00`)으로 옵니다.
 */
export function getAccount() {
  return api.get<AccountInfo>('/api/users/me/account')
}

/**
 * 이메일 변경. `PATCH /api/users/me/email` (Cue-A/backend#125) — 이슈 #201
 *
 * 새 이메일과 **현재 비밀번호**를 같이 보냅니다. 응답은 바뀐 이메일 `{ email }` 입니다.
 * - 이메일로 가입한(LOCAL) 계정만 됩니다. 카카오 전용 계정은 400 `EMAIL_CHANGE_NOT_ALLOWED` — 화면은 그런 계정에 줄을 두지 않습니다
 * - 현재 비밀번호가 틀리면 401 `INVALID_CREDENTIALS` 입니다. 401 이지만 강제 로그아웃 코드가 아니라 로그인 화면으로 가지 않습니다
 * - 다른 계정이 쓰는 이메일이면 409 `EMAIL_ALREADY_EXISTS`, 형식이 틀리면 400 `INVALID_REQUEST` 입니다. 지금 이메일과 같으면 그대로 성공합니다
 * - 바꿔도 로그인은 유지됩니다(토큰을 다시 받지 않습니다)
 */
export async function changeEmail(newEmail: string, currentPassword: string) {
  const response = await api.patch<EmailChangeResponse>('/api/users/me/email', { newEmail, currentPassword })
  return response.email
}

/**
 * 비밀번호 변경. `PATCH /api/users/me/password` (Cue-A/backend#127) — 이슈 #201. 응답 본문이 없습니다.
 *
 * - 새 비밀번호는 회원가입과 같은 규칙(영문 · 숫자를 하나 이상씩 넣어 8~64자)이고, 어기면 400 `INVALID_PASSWORD_FORMAT` 입니다
 * - 현재 비밀번호가 틀리면 401 `INVALID_CREDENTIALS`, 카카오 전용 계정은 400 `PASSWORD_NOT_SET` 입니다
 * - **다른 기기의 로그인은 끊지 않습니다.** 서버가 비밀번호만 바꾸고 토큰은 그대로 둡니다 (백엔드 `UserPasswordService` 확인)
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  await api.patch<void>('/api/users/me/password', { currentPassword, newPassword })
}

/**
 * 알림 설정. API 명세서에 알림 도메인 자체가 없어서 경로는 임시로 정했습니다 — 목업 전용입니다.
 * 백엔드 계약이 생기면 맞춰 고칩니다. (Q16)
 */
export function getNotificationSettings() {
  return api.get<NotificationSettings>('/api/users/me/notification-settings')
}

/** 바꾼 항목만 보냅니다. 돌려받는 값은 바뀐 뒤의 전체 설정입니다 */
export function updateNotificationSettings(input: Partial<NotificationSettings>) {
  return api.patch<NotificationSettings>('/api/users/me/notification-settings', input)
}

/**
 * 회원 탈퇴. `DELETE /api/users/me` (Cue-A/backend#64)
 *
 * 계정과 모든 연관 데이터(문서 · 면접 기록 · 리포트 등)를 영구 삭제하고, **로그인된 모든 기기의 refresh token 을 폐기**합니다.
 * 본문이 없습니다 — 탈퇴 이유는 받지 않기로 했습니다(이슈 #201). 화면은 응답을 받자마자 이 브라우저의 토큰을 지웁니다 (`useWithdraw`).
 */
export function withdraw() {
  return api.delete<void>('/api/users/me')
}
