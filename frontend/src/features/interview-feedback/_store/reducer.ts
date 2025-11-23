import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import { ErrorDto } from '../../api/models'
import { Status } from '../../app/_store/state'
import { generateInterviewFeedback, getInterviewFeedback } from './effects'
import { initialState } from './state'

export const interviewFeedbackMiddleware = createListenerMiddleware()

interviewFeedbackMiddleware.startListening({
    matcher: generateInterviewFeedback.fulfilled.match,
    effect: async (action, listenerApi) => {
        await listenerApi.delay(2000)
        await listenerApi.dispatch(
            getInterviewFeedback({
                sessionId: action.meta.arg?.sessionId,
            }),
        )
    },
})

const interviewFeedbackSlice = createSlice({
    name: 'interview-feedback',
    initialState,
    reducers: {
        resetFeedback: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(generateInterviewFeedback.pending, (state) => {
                state.status = Status.PENDING
            })
            .addCase(generateInterviewFeedback.fulfilled, (state) => {
                state.error = null
            })
            .addCase(generateInterviewFeedback.rejected, (state, action) => {
                state.error = action.payload as ErrorDto
                state.status = Status.ERROR
            })
            .addCase(getInterviewFeedback.pending, (state) => {
                state.status = Status.PENDING
            })
            .addCase(getInterviewFeedback.fulfilled, (state, action) => {
                state.feedback = action.payload.feedback ?? ''
                state.areas_for_improvement =
                    action.payload.areas_for_improvement ?? ''
                state.status = Status.SUCCESS
            })
            .addCase(getInterviewFeedback.rejected, (state, action) => {
                state.error = action.payload as ErrorDto
                state.status = Status.ERROR
            })
    },
})

export const { resetFeedback } = interviewFeedbackSlice.actions

export default interviewFeedbackSlice.reducer
