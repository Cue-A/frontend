import { api } from '@/shared/api/apiClient'

import type {
  BusinessCard,
  BusinessCardInput,
  CompanyInterest,
  LoginProvider,
  Me,
  NotificationSettings,
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
  /** 실제 서버는 아직 이 필드를 안 줍니다 — 없으면 null 로 둡니다 */
  jobTitle?: string | null
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
    jobTitle: response.jobTitle ?? null,
  }
}

/**
 * 프로필 수정. `PATCH /users/me/profile` — **백엔드에 아직 없습니다** (API 명세서 시작 전).
 * 실제 계약이 정해지면 이름 · 직무만 보낼지, 이메일(지금은 별도 `PATCH /api/users/me/email`)도
 * 같이 받을지 다시 맞춰야 합니다. 지금은 화면을 완성해두려고 셋을 한 번에 보냅니다.
 */
export async function updateProfile(input: ProfileUpdateInput): Promise<Me> {
  const response = await api.patch<UserResponse>('/users/me/profile', input)
  return {
    userId: response.userId,
    nickname: response.nickname,
    email: response.email,
    providers: response.providers,
    jobTitle: response.jobTitle ?? null,
  }
}

/** 관심 기업 목록. `GET /v1/users/me/company-interests` — 백엔드 시작 전, 목업만 있습니다. */
export function getCompanyInterests() {
  return api.get<CompanyInterest[]>('/v1/users/me/company-interests')
}

/** 관심 기업 등록. `PUT /v1/users/me/company-interests/{companyId}` — 백엔드 시작 전. */
export function addCompanyInterest(companyId: string) {
  return api.put<void>(`/v1/users/me/company-interests/${encodeURIComponent(companyId)}`)
}

/** 관심 기업 해제. `DELETE /v1/users/me/company-interests/{companyId}` — 백엔드 시작 전. */
export function removeCompanyInterest(companyId: string) {
  return api.delete<void>(`/v1/users/me/company-interests/${encodeURIComponent(companyId)}`)
}

/**
 * 알림 설정. API 명세서에 알림 도메인 자체가 없어서 경로는 임시로 정했습니다 — 목업 전용입니다.
 * 백엔드 계약이 생기면 맞춰 고칩니다.
 */
export function getNotificationSettings() {
  return api.get<NotificationSettings>('/api/users/me/notification-settings')
}

export function updateNotificationSettings(input: NotificationSettings) {
  return api.patch<NotificationSettings>('/api/users/me/notification-settings', input)
}

/** 명함 조회. `GET /api/users/me/business-card` — 백엔드 시작 전, 목업만 있습니다. */
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
