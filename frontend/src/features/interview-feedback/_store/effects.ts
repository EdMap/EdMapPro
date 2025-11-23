/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import Api from '../../api'
import { toErrorDto } from '../../api/error-mapper'
import { HasSessionId } from '../../interview-practice/_store/effects'

export const generateInterviewFeedback = createAsyncThunk(
    'interview-feedback/generate-feedback',
    async ({ sessionId }: HasSessionId, { rejectWithValue }) => {
        try {
            const api = Api()
            const response =
                await api.interviewSimulation.generateSessionFeedback({
                    session_id: sessionId,
                })

            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)

export const getInterviewFeedback = createAsyncThunk(
    'interview-feedback/get-feedback',
    async ({ sessionId }: HasSessionId, { rejectWithValue }) => {
        try {
            const api = Api()
            const response = await api.interviewSimulation.getSessionFeedback({
                session_id: sessionId,
            })

            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)
