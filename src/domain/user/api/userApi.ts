import { api } from '@/shared/api/apiClient'

import type {
  AccountInfo,
  BusinessCard,
  BusinessCardInput,
  LoginProvider,
  Me,
  NotificationSettings,
  Profile,
  ProfileUpdateInput,
  WithdrawRequest,
} from '../types/user'

import './userMock'

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

/**
 * 내 프로필. `GET /api/users/me/profile` (API 명세서 "내정보 조회")
 *
 * **백엔드에 아직 없습니다**(명세서 "시작 전"). 목업(`missingInBackend`)이 답합니다. (docs/90-open-questions.md Q16)
 * 응답 모양이 화면 타입(`Profile`)과 같아서 그대로 씁니다.
 */
export function getProfile() {
  return api.get<Profile>('/api/users/me/profile')
}

/**
 * 프로필 수정. `PATCH /api/users/me/profile` (API 명세서 "프로필 수정")
 *
 * **바꾼 칸만 보냅니다.** 빈 본문은 `EMPTY_UPDATE_REQUEST`(400) 라, 화면이 바뀐 게 없으면 부르지 않습니다.
 * 고친 뒤의 프로필 전체를 돌려받습니다. 백엔드에 아직 없어 목업이 답합니다. (Q16)
 */
export function updateProfile(input: ProfileUpdateInput) {
  return api.patch<Profile>('/api/users/me/profile', input)
}

/**
 * 계정 정보. `GET /api/users/me/account` (API 명세서 "계정 정보 조회")
 *
 * 이메일 · 가입일 · 로그인 수단별 연결일과 비밀번호 유무입니다. 비밀번호 원문 · 카카오 회원번호는 오지 않습니다.
 * 백엔드에 아직 없어 목업이 답합니다. (Q16)
 */
export function getAccount() {
  return api.get<AccountInfo>('/api/users/me/account')
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

/** 명함 조회. `GET /api/users/me/business-card` — 백엔드 시작 전, 목업만 있습니다. 아직 만들지 않았으면 null 입니다 */
export function getBusinessCard() {
  return api.get<BusinessCard | null>('/api/users/me/business-card')
}

/** 명함 생성. `POST /api/users/me/business-card` — 백엔드 시작 전. */
export function createBusinessCard(input: BusinessCardInput) {
  return api.post<BusinessCard>('/api/users/me/business-card', input)
}

/** 명함 수정. `PATCH /api/users/me/business-card` — 백엔드 시작 전. */
export function updateBusinessCard(input: BusinessCardInput) {
  return api.patch<BusinessCard>('/api/users/me/business-card', input)
}

/**
 * 회원 탈퇴. `POST /api/users/me/withdrawal` — **백엔드에 아직 없습니다.** 경로와 본문은 임시로 정한 것이라
 * 목업(`missingInBackend`)이 답합니다. 백엔드에 생기면 계약을 대조하고 목업 표시를 지웁니다.
 * (docs/90-open-questions.md Q14)
 *
 * `DELETE /api/users/me` 가 아니라 POST 로 둔 이유는 탈퇴 이유를 본문에 실어야 해서입니다. DELETE 본문은
 * 서버 · 프록시에 따라 버려질 수 있습니다.
 *
 * 성공하면 서버가 이 사용자의 refresh token 을 모두 끊는다고 가정합니다. 화면은 응답을 받자마자
 * 이 브라우저의 토큰을 지웁니다 (`useWithdraw`).
 */
export function withdraw(body: WithdrawRequest) {
  return api.post<void>('/api/users/me/withdrawal', body)
}
