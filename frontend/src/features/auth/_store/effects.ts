/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import {
    UserLogin,
    UserProfileUpdateDto,
    UserRegistration,
} from '../../../__generated__/api'
import Api from '../../api'
import { toErrorDto } from '../../api/error-mapper'
import { RootState } from '../../app/_store'
import { logout } from './reducer'

export const register = createAsyncThunk(
    'auth/register',
    async (userData: UserRegistration, { rejectWithValue }) => {
        try {
            const api = Api()
            const response = await api.accounts.register(userData)
            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)

export const login = createAsyncThunk(
    'auth/login',
    async (userData: UserLogin, { rejectWithValue }) => {
        try {
            console.log('Login thunk called with:', userData)
            const api = Api()
            console.log('Making login request to API...')

            const response = await api.accounts.login(userData)
            console.log('Login response:', response)
            return response.data
        } catch (error) {
            console.error('Login error:', error)
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)

export const refreshToken = createAsyncThunk(
    'auth/refresh',
    async (_, { rejectWithValue, dispatch, getState }) => {
        const { auth } = getState() as RootState
        const { token, refresh } = auth

        try {
            const api = Api()

            const response = await api.accounts.refresh({
                access: token!,
                refresh: refresh!,
            })
            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            dispatch(logout())
            return rejectWithValue(errorDto)
        }
    },
)

export const profile = createAsyncThunk(
    'auth/profile',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const api = Api()
            const response = await api.accounts.profile()
            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            dispatch(logout())
            return rejectWithValue(errorDto)
        }
    },
)

export const updateProfile = createAsyncThunk(
    'auth/update-profile',
    async (data: UserProfileUpdateDto, { rejectWithValue, dispatch }) => {
        try {
            const api = Api()
            const response = await api.accounts.profileUpdate(data)
            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            dispatch(logout())
            return rejectWithValue(errorDto)
        }
    },
)
