/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { SendMessageRequest } from '../../../__generated__/api'
import Api from '../../api'
import { toErrorDto } from '../../api/error-mapper'
import { RootState } from '../../app/_store'

export type HasSessionId = {
    sessionId: string
}

export const startInterviewSession = createAsyncThunk(
    'interview-practice/create-session',
    async (_, { rejectWithValue, getState }) => {
        try {
            const api = Api()
            const { 'interview-practice': state } = getState() as RootState
            const response = await api.interviewSimulation.startSession(
                state.configuration,
            )

            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)

export const greetCandidate = createAsyncThunk(
    'interview-practice/greet-candidate',
    async ({ sessionId }: HasSessionId, { rejectWithValue }) => {
        try {
            const api = Api()

            const response = await api.interviewSimulation.greetCandidate({
                session_id: sessionId,
            })
            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)

export const getHistory = createAsyncThunk(
    'interview-session/get-history',
    async ({ sessionId }: HasSessionId, { rejectWithValue }) => {
        try {
            const api = Api()

            const response = await api.interviewSimulation.getSessionHistory({
                session_id: sessionId,
            })

            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)

export const sendMessage = createAsyncThunk(
    'interview-session/send-message',
    async (
        { session_id, message }: SendMessageRequest,
        { rejectWithValue },
    ) => {
        try {
            const api = Api()

            const response = await api.interviewSimulation.sendMessage({
                session_id,
                message,
            })
            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)
