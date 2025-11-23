import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import { ErrorDto } from '../../api/models'
import { Status } from '../../app/_store/state'
import { generateNegotiationFeedback, getNegotiationFeedback } from './effects'
import { initialState } from './state'

export const negotiationFeedbackMiddleware = createListenerMiddleware()

negotiationFeedbackMiddleware.startListening({
    matcher: generateNegotiationFeedback.fulfilled.match,
    effect: async (action, listenerApi) => {
        await listenerApi.delay(2000)
        await listenerApi.dispatch(
            getNegotiationFeedback({
                sessionId: action.meta.arg?.sessionId,
            }),
        )
    },
})

const negotiationFeedbackSlice = createSlice({
    name: 'negotiation-feedback',
    initialState,
    reducers: {
        resetNegotiationFeedback: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(generateNegotiationFeedback.pending, (state) => {
                state.status = Status.PENDING
            })
            .addCase(generateNegotiationFeedback.fulfilled, (state) => {
                state.error = null
            })
            .addCase(generateNegotiationFeedback.rejected, (state, action) => {
                state.error = action.payload as ErrorDto
                state.status = Status.ERROR
            })
            .addCase(getNegotiationFeedback.pending, (state) => {
                state.status = Status.PENDING
            })
            .addCase(getNegotiationFeedback.fulfilled, (state, action) => {
                state.feedback = action.payload.feedback ?? ''
                state.areas_for_improvement =
                    action.payload.areas_for_improvement ?? ''
                state.status = Status.SUCCESS
                state.offer = action.payload.offer ?? ''
            })
            .addCase(getNegotiationFeedback.rejected, (state, action) => {
                state.error = action.payload as ErrorDto
                state.status = Status.ERROR
            })
    },
})

export const { resetNegotiationFeedback } = negotiationFeedbackSlice.actions

export default negotiationFeedbackSlice.reducer
