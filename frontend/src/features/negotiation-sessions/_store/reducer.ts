import { createListenerMiddleware, createSlice } from '@reduxjs/toolkit'
import { isNullish } from '../../../utils'
import { Status } from '../../app/_store/state'
import navigation from '../../app/navigation'
import { getNegotiationSessions } from './effects'
import { initialState } from './state'

export const negotiationSessionsMiddleware = createListenerMiddleware()

const negotiationSessionsSlice = createSlice({
    name: 'negotiation-sessions',
    initialState,
    reducers: {
        resetNegotiationSessions: () => {
            return { ...initialState }
        },

        setNegotiationSessionsPagination: (state, action) => {
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
            .addCase(getNegotiationSessions.pending, (state) => {
                state.status = Status.PENDING
                state.error = null
                state.data = null
            })
            .addCase(getNegotiationSessions.fulfilled, (state, action) => {
                state.error = null
                state.data = action.payload.results
                state.status = Status.SUCCESS
                state.pagination.hasMore = !isNullish(action.payload.next)
            })
    },
})

negotiationSessionsMiddleware.startListening({
    matcher:
        negotiationSessionsSlice.actions.setNegotiationSessionsPagination.match,
    effect: async (_, listenerApi) => {
        await listenerApi.dispatch(getNegotiationSessions())
    },
})

export const { resetNegotiationSessions, setNegotiationSessionsPagination } =
    negotiationSessionsSlice.actions

export default negotiationSessionsSlice.reducer
