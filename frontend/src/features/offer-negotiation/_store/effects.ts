/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { SendMessageRequest } from '../../../__generated__/api'
import Api from '../../api'
import { toErrorDto } from '../../api/error-mapper'

export type HasSessionId = {
    sessionId: string
}

export const startNegotiationSession = createAsyncThunk(
    'offer-negotiation/create-session',
    async (_, { rejectWithValue }) => {
        try {
            const api = Api()
            const response =
                await api.offerNegotiationSimulation.startNegotiationSession()

            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)

export const greetNegotiationCandidate = createAsyncThunk(
    'offer-negotiation/greet-candidate',
    async ({ sessionId }: HasSessionId, { rejectWithValue }) => {
        try {
            const api = Api()

            const response =
                await api.offerNegotiationSimulation.greetNegotiationCandidate({
                    session_id: sessionId,
                })
            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)

export const getNegotiationHistory = createAsyncThunk(
    'offer-negotiation/get-history',
    async ({ sessionId }: HasSessionId, { rejectWithValue }) => {
        try {
            const api = Api()

            const response =
                await api.offerNegotiationSimulation.getNegotiationSessionHistory(
                    {
                        session_id: sessionId,
                    },
                )

            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)

export const sendNegotiationMessage = createAsyncThunk(
    'interview-session/send-message',
    async (
        { session_id, message }: SendMessageRequest,
        { rejectWithValue },
    ) => {
        try {
            const api = Api()

            const response =
                await api.offerNegotiationSimulation.sendNegotiationMessage({
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
