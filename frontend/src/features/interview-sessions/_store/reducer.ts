import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import { isNullish } from '../../../utils'
import { Status } from '../../app/_store/state'
import navigation from '../../app/navigation'
import { getInterviewSessions } from './effects'
import { initialState } from './state'

export const interviewSessionsMiddleware = createListenerMiddleware()

const interviewSessionsSlice = createSlice({
    name: 'interview-sessions',
    initialState,
    reducers: {
        resetInterviewSessions: () => {
            return { ...initialState }
        },

        setInterviewSessionsPagination: (state, action) => {
            const limit = action.payload.limit ?? state.pagination.limit
            const offset = action.payload.offset ?? state.pagination.offset

            state.pagination.limit = limit
            state.pagination.offset = offset

            navigation.goToSearchParams({
                limit,
                offset,
            })
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(getInterviewSessions.pending, (state) => {
                state.status = Status.PENDING
                state.error = null
                state.data = null
            })
            .addCase(getInterviewSessions.fulfilled, (state, action) => {
                state.error = null
                state.data = action.payload.results
                state.status = Status.SUCCESS
                state.pagination.hasMore = !isNullish(action.payload.next)
            })
    },
})

interviewSessionsMiddleware.startListening({
    matcher:
        interviewSessionsSlice.actions.setInterviewSessionsPagination.match,
    effect: async (_, listenerApi) => {
        await listenerApi.dispatch(getInterviewSessions())
    },
})

export const { resetInterviewSessions, setInterviewSessionsPagination } =
    interviewSessionsSlice.actions

export default interviewSessionsSlice.reducer
