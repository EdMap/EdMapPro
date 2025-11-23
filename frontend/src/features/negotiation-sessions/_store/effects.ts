/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import Api from '../../api'
import { toErrorDto } from '../../api/error-mapper'
import { RootState } from '../../app/_store'

export const getNegotiationSessions = createAsyncThunk(
    'negotiation-sessions/list',
    async (_, { rejectWithValue, getState }) => {
        try {
            const {
                pagination: { limit, offset },
            } = (getState() as RootState)['negotiation-sessions']
            const api = Api()
            const response =
                await api.offerNegotiationSimulation.getNegotiationSessions({
                    limit,
                    offset,
                })

            return response.data
        } catch (error) {
            const errorDto = await toErrorDto(error as any)
            return rejectWithValue(errorDto)
        }
    },
)
