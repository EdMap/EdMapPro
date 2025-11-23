import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import {
    InterviewMessage,
    MessageOwnerTypeEnum,
    SessionStatusEnum,
} from '../../../__generated__/api'
import { ErrorDto } from '../../api/models'
import { Status } from '../../app/_store/state'
import {
    getHistory,
    greetCandidate,
    sendMessage,
    startInterviewSession,
} from './effects'
import { initialState } from './state'

export const interviewStartMiddleware = createListenerMiddleware()

interviewStartMiddleware.startListening({
    matcher: startInterviewSession.fulfilled.match,
    effect: async (action, listenerApi) => {
        await listenerApi.delay(2000)
        await listenerApi.dispatch(
            greetCandidate({ sessionId: action.payload.session_id }),
        )
    },
})

export const PENDING_MESSAGE: InterviewMessage = {
    id: 0,
    message_owner_type: MessageOwnerTypeEnum.Gpt,
    text: '...',
}

const interviewPracticeSlice = createSlice({
    name: 'interview-practice',
    initialState,
    reducers: {
        resetSimulation: () => initialState,
        setSessionId: (state, action) => {
            state.sessionId = action.payload
        },

        setConfiguration: (state, action) => {
            state.configuration = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(startInterviewSession.pending, (state) => {
                state.status = Status.PENDING
                state.messages = [PENDING_MESSAGE]
            })
            .addCase(startInterviewSession.fulfilled, (state, action) => {
                state.sessionId = action.payload?.session_id
            })
            .addCase(startInterviewSession.rejected, (state, action) => {
                const error = action.payload
                state.error = error as ErrorDto
                state.status = Status.ERROR
            })

            .addCase(greetCandidate.pending, (state) => {
                state.status = Status.PENDING
            })
            .addCase(greetCandidate.fulfilled, (state, action) => {
                const { session, message } = action.payload
                state.status = Status.SUCCESS
                state.messages[state.messages.length - 1] = message
                state.sessionState = session.session_status
            })
            .addCase(greetCandidate.rejected, (state, action) => {
                state.status = Status.ERROR
                state.error = action.payload as ErrorDto
                state.sessionState = SessionStatusEnum.Done
            })

            .addCase(getHistory.pending, (state) => {
                state.status = Status.PENDING
            })
            .addCase(getHistory.fulfilled, (state, action) => {
                const { interview_messages, session_id, session_status } =
                    action.payload

                state.status = Status.SUCCESS
                state.messages = interview_messages
                state.sessionId = session_id
                state.sessionState = session_status
                state.hasFeedback = !!action.payload.feedback?.length
            })
            .addCase(getHistory.rejected, (state, action) => {
                state.status = Status.ERROR
                state.error = action.payload as ErrorDto
                state.sessionState = SessionStatusEnum.Done
            })

            .addCase(sendMessage.pending, (state, action) => {
                state.status = Status.PENDING

                const id = new Date().getMilliseconds()
                const message: InterviewMessage = {
                    id,
                    is_greeting: false,
                    message_owner_type: MessageOwnerTypeEnum.User,
                    text: action.meta.arg.message,
                }

                state.messages.push(message, PENDING_MESSAGE)
            })

            .addCase(sendMessage.fulfilled, (state, action) => {
                const { session, message } = action.payload

                state.status = Status.SUCCESS
                state.sessionState = session.session_status
                state.messages[state.messages.length - 1] = message
            })

            .addCase(sendMessage.rejected, (state, action) => {
                state.status = Status.ERROR
                state.error = action.payload as ErrorDto
                state.sessionState = SessionStatusEnum.Done
            })
    },
})

export const { setSessionId, resetSimulation, setConfiguration } =
    interviewPracticeSlice.actions

export default interviewPracticeSlice.reducer
