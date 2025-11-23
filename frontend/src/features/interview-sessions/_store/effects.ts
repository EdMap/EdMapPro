/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import Api from '../../api'
import { toErrorDto } from '../../api/error-mapper'
import { RootState } from '../../app/_store'

export const getInterviewSessions = createAsyncThunk(
    'interview-sessions/list',
    async (_, { rejectWithValue, getState }) => {
        try {
            const {
                pagination: { limit, offset },
            } = (getState() as RootState)['interview-sessions']
            const api = Api()
            const response = await api.interviewSimulation.getInterviewSessions(
                {
                    limit,
                    offset,
                },
            )

            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)
