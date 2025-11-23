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

const getUserFromStorage = () => {
    try {
        const stored = globalThis.localStorage.getItem(USER)
        return stored ? JSON.parse(stored) : null
    } catch {
        return null
    }
}

export const initialState: AuthState = {
    user: getUserFromStorage(),
    token: globalThis.localStorage.getItem(ACCESS_TOKEN) ?? null,
    refresh: globalThis.localStorage.getItem(REFRESH_TOKEN) ?? null,
    error: null,
    status: null,
}
