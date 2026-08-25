import { discogsRequest } from './client'
import type { DiscogsResponse } from './client'

export interface AuthStatus {
  authenticated: boolean
}

export interface LoginResponse {
  authorizeUrl: string
}

export function fetchAuthStatus(): Promise<DiscogsResponse<AuthStatus>> {
  return discogsRequest('/auth/discogs/status')
}

export function login(): Promise<DiscogsResponse<LoginResponse>> {
  return discogsRequest('/auth/discogs/login', { method: 'POST' })
}
