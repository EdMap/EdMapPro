/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
    TokenRefresh,
    UserProfile,
    UserTokenDto,
} from '../../../__generated__/api'
import { isNullish } from '../../../utils'
import { ErrorDto } from '../../api/models'
import { Status } from '../../app/_store/state'
import {
    login,
    profile,
    refreshToken,
    register,
    updateProfile,
} from './effects'
import {
    ACCESS_TOKEN,
    AuthState,
    initialState,
    REFRESH_TOKEN,
    USER,
} from './state'

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.status = null
            state.error = null
            state.token = null
            state.refresh = null
            state.user = null
            globalThis.localStorage.clear()
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => {
                state.status = Status.PENDING
                state.error = null
            })
            .addCase(register.fulfilled, (state, action) => {
                const { access, refresh, user } = action.payload
                if (
                    !isNullish(access) &&
                    access !== '' &&
                    !isNullish(user?.username)
                ) {
                    state.status = Status.SUCCESS
                    state.token = access
                    state.refresh = refresh
                    state.user = user
                    globalThis.localStorage.setItem(ACCESS_TOKEN, access!)
                    globalThis.localStorage.setItem(REFRESH_TOKEN, refresh!)
                    globalThis.localStorage.setItem(USER, JSON.stringify(user))
                }
            })
            .addCase(
                register.rejected,
                (state, action: PayloadAction<unknown>) => {
                    const { message } = action.payload as ErrorDto
                    state.status = Status.ERROR
                    state.error = message ?? 'Registration failed'
                },
            )

            .addCase(login.pending, (state) => {
                state.status = Status.PENDING
                state.error = null
            })
            .addCase(
                login.fulfilled,
                (state, action: PayloadAction<UserTokenDto>) => {
                    const { access, refresh, user } = action.payload
                    if (
                        !isNullish(access) &&
                        access !== '' &&
                        !isNullish(user?.username)
                    ) {
                        state.status = Status.SUCCESS
                        state.token = access
                        state.refresh = refresh
                        state.user = user
                        globalThis.localStorage.setItem(ACCESS_TOKEN, access!)
                        globalThis.localStorage.setItem(REFRESH_TOKEN, refresh!)
                        globalThis.localStorage.setItem(
                            USER,
                            JSON.stringify(user),
                        )
                    }
                },
            )
            .addCase(
                login.rejected,
                (state, action: PayloadAction<unknown>) => {
                    const { message } = action.payload as ErrorDto
                    state.status = Status.ERROR
                    state.error = message ?? 'Login failed'
                },
            )
            .addCase(
                refreshToken.fulfilled,
                (state: AuthState, action: PayloadAction<TokenRefresh>) => {
                    const { access, refresh } = action.payload

                    if (!isNullish(access) && access !== '') {
                        state.token = access
                        state.refresh = refresh
                        state.status = Status.SUCCESS

                        globalThis.localStorage.setItem(ACCESS_TOKEN, access)
                        globalThis.localStorage.setItem(REFRESH_TOKEN, refresh)
                    }
                },
            )
            .addCase(
                refreshToken.rejected,
                (state: AuthState, action: PayloadAction<unknown>) => {
                    const { message } = action.payload as ErrorDto
                    state.status = Status.ERROR
                    state.error = message ?? "Couldn't refresh token"
                },
            )
            .addCase(
                profile.fulfilled,
                (state: AuthState, action: PayloadAction<UserProfile>) => {
                    const { user } = action.payload
                    if (!isNullish(user?.username)) {
                        state.user = user
                        state.status = Status.SUCCESS
                        globalThis.localStorage.setItem(
                            USER,
                            JSON.stringify(user),
                        )
                    }
                },
            )
            .addCase(
                profile.rejected,
                (state, action: PayloadAction<unknown>) => {
                    const { message } = action.payload as ErrorDto
                    state.status = Status.ERROR
                    state.error = message ?? "Couldn't get user profile"
                },
            )

            .addCase(updateProfile.pending, (state) => {
                state.status = Status.PENDING
                state.error = null
            })

            .addCase(
                updateProfile.fulfilled,
                (state, action: PayloadAction<UserProfile>) => {
                    state.user = action.payload.user
                    state.status = Status.SUCCESS
                    globalThis.localStorage.setItem(
                        USER,
                        JSON.stringify(action.payload.user),
                    )
                },
            )

            .addCase(
                updateProfile.rejected,
                (state: AuthState, action: PayloadAction<unknown>) => {
                    const { message } = action.payload as ErrorDto
                    state.status = Status.ERROR
                    state.error = message ?? "Couldn't update user profile"
                },
            )
    },
})

export const { logout } = authSlice.actions

export default authSlice.reducer
