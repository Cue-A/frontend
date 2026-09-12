import { api } from '@/shared/api/apiClient'

import type { AuthResult, LoginRequest, SignupRequest } from '../types/auth'

import './authMock'

export function login(body: LoginRequest) {
  return api.post<AuthResult>('/api/auth/login', body)
}

export function signup(body: SignupRequest) {
  return api.post<AuthResult>('/api/auth/signup', body)
}
