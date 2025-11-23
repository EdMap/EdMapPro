import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../../auth/_store/reducer'
import interviewFeedbackReducer, {
    interviewFeedbackMiddleware,
} from '../../interview-feedback/_store/reducer'
import interviewPracticeReducer, {
    interviewStartMiddleware,
} from '../../interview-practice/_store/reducer'
import InterviewSessionsReducer, {
    interviewSessionsMiddleware,
} from '../../interview-sessions/_store/reducer'
import negotiationFeedbackReducer, {
    negotiationFeedbackMiddleware,
} from '../../negotiation-feedback/_store/reducer'
import negotiationSessionsReducer, {
    negotiationSessionsMiddleware,
} from '../../negotiation-sessions/_store/reducer'
import offerNegotiationReducer, {
    negotiationStartMiddleware,
} from '../../offer-negotiation/_store/reducer'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        ['interview-feedback']: interviewFeedbackReducer,
        ['interview-practice']: interviewPracticeReducer,
        ['interview-sessions']: InterviewSessionsReducer,
        ['negotiation-feedback']: negotiationFeedbackReducer,
        ['negotiation-sessions']: negotiationSessionsReducer,
        ['offer-negotiation']: offerNegotiationReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .prepend(interviewFeedbackMiddleware.middleware)
            .prepend(interviewStartMiddleware.middleware)
            .prepend(negotiationStartMiddleware.middleware)
            .prepend(negotiationFeedbackMiddleware.middleware)
            .prepend(interviewSessionsMiddleware.middleware)
            .prepend(negotiationSessionsMiddleware.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type RootDispatch = typeof store.dispatch
