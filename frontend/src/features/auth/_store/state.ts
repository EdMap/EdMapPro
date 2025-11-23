import { UserTokenDto } from '../../../__generated__/api'
import { Status } from '../../app/_store/state'

export const ACCESS_TOKEN = 'ACCESS'
export const REFRESH_TOKEN = 'REFRESH'
export const USER = 'USER'

export type AuthState = {
    status?: Status | null
    error?: string | null
    token?: string | null
} & Omit<UserTokenDto, 'access'>

export const initialState: AuthState = {
    user: JSON.parse(globalThis.localStorage.getItem(USER)!) ?? null,
    token: globalThis.localStorage.getItem(ACCESS_TOKEN) ?? null,
    refresh: globalThis.localStorage.getItem(REFRESH_TOKEN) ?? null,
    error: null,
    status: null,
}
