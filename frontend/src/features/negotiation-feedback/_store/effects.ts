/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import Api from '../../api'
import { toErrorDto } from '../../api/error-mapper'
import { HasSessionId } from '../../interview-practice/_store/effects'

export const generateNegotiationFeedback = createAsyncThunk(
    'negotiation-feedback/generate-feedback',
    async ({ sessionId }: HasSessionId, { rejectWithValue }) => {
        try {
            const api = Api()
            const response =
                await api.offerNegotiationSimulation.generateOfferNegotiationFeedback(
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

export const getNegotiationFeedback = createAsyncThunk(
    'negotiation-feedback/get-feedback',
    async ({ sessionId }: HasSessionId, { rejectWithValue }) => {
        try {
            const api = Api()
            const response =
                await api.offerNegotiationSimulation.getNegotiationSessionFeedback(
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
