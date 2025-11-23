import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import {
    MessageOwnerTypeEnum,
    NegotiationMessage,
    SessionStatusEnum,
} from '../../../__generated__/api'
import { isNone } from '../../../utils/is-none'
import { ErrorDto } from '../../api/models'
import { RootState } from '../../app/_store'
import { Status } from '../../app/_store/state'
import {
    getNegotiationHistory,
    greetNegotiationCandidate,
    sendNegotiationMessage,
    startNegotiationSession,
} from './effects'
import { initialState } from './state'

export const negotiationStartMiddleware = createListenerMiddleware()

export const PENDING_MESSAGE: NegotiationMessage = {
    id: 0,
    message_owner_type: MessageOwnerTypeEnum.Gpt,
    text: '...',
}

const offerNegotiationSlice = createSlice({
    name: 'offer-negotiation',
    initialState,
    reducers: {
        resetOfferNegotiation: () => initialState,
        setNegotiationSessionId: (state, action) => {
            state.sessionId = action.payload
        },
        setShowNegotiationChat: (state) => {
            state.showNegotiation = true
            state.messages = [PENDING_MESSAGE]
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(startNegotiationSession.pending, (state) => {
                state.status = Status.PENDING
            })
            .addCase(startNegotiationSession.fulfilled, (state, action) => {
                state.sessionId = action.payload?.session_id
                state.initial_offer = action.payload?.initial_offer
                state.status = Status.SUCCESS
            })
            .addCase(startNegotiationSession.rejected, (state, action) => {
                const error = action.payload
                state.error = error as ErrorDto
                state.status = Status.ERROR
            })

            .addCase(greetNegotiationCandidate.pending, (state) => {
                state.status = Status.PENDING
            })
            .addCase(greetNegotiationCandidate.fulfilled, (state, action) => {
                const { session, message } = action.payload
                state.status = Status.SUCCESS
                state.messages[state.messages.length - 1] = message
                state.sessionState = session.session_status
            })
            .addCase(greetNegotiationCandidate.rejected, (state, action) => {
                state.status = Status.ERROR
                state.error = action.payload as ErrorDto
                state.sessionState = SessionStatusEnum.Done
            })

            .addCase(getNegotiationHistory.pending, (state) => {
                state.status = Status.PENDING
            })
            .addCase(getNegotiationHistory.fulfilled, (state, action) => {
                const {
                    negotiation_messages,
                    session_id,
                    session_status,
                    initial_offer,
                    offer,
                } = action.payload

                state.status = Status.SUCCESS
                state.messages = negotiation_messages
                state.sessionId = session_id
                state.sessionState = session_status

                state.initial_offer = !isNone(initial_offer)
                    ? initial_offer
                    : null
                state.offer = !isNone(offer) ? offer : null
                if (negotiation_messages?.length) {
                    state.showNegotiation = true
                }
            })
            .addCase(getNegotiationHistory.rejected, (state, action) => {
                state.status = Status.ERROR
                state.error = action.payload as ErrorDto
                state.sessionState = SessionStatusEnum.Done
            })

            .addCase(sendNegotiationMessage.pending, (state, action) => {
                state.status = Status.PENDING

                const id = new Date().getMilliseconds()
                const message: NegotiationMessage = {
                    id,
                    is_greeting: false,
                    message_owner_type: MessageOwnerTypeEnum.User,
                    text: action.meta.arg.message,
                }

                state.messages.push(message, PENDING_MESSAGE)
            })

            .addCase(sendNegotiationMessage.fulfilled, (state, action) => {
                const { session, message } = action.payload

                state.status = Status.SUCCESS
                state.sessionState = session.session_status
                state.messages[state.messages.length - 1] = message
            })

            .addCase(sendNegotiationMessage.rejected, (state, action) => {
                state.status = Status.ERROR
                state.error = action.payload as ErrorDto
                state.sessionState = SessionStatusEnum.Done
            })
    },
})

negotiationStartMiddleware.startListening({
    matcher: offerNegotiationSlice.actions.setShowNegotiationChat.match,
    effect: async (_, listenerApi) => {
        const state = (listenerApi.getState() as RootState)['offer-negotiation']
        await listenerApi.delay(2000)
        await listenerApi.dispatch(
            greetNegotiationCandidate({ sessionId: state.sessionId! }),
        )
    },
})

export const {
    setNegotiationSessionId,
    resetOfferNegotiation,
    setShowNegotiationChat,
} = offerNegotiationSlice.actions

export default offerNegotiationSlice.reducer
