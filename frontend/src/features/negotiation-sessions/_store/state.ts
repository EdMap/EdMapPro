import { SimulationSessions } from '../../../__generated__/api'
import { ErrorDto } from '../../api/models'
import { PAGINATION_LIMITS } from '../../app/_store/constants'
import { Pagination, Status } from '../../app/_store/state'

export type NegotiationSessionsState = {
    data: SimulationSessions[] | null
    status: Status | null
    error: ErrorDto | null
} & Pagination

export const initialNegotiationSessionsPagination = {
    limit: PAGINATION_LIMITS[0],
    offset: 0,
}

export const initialState: NegotiationSessionsState = {
    data: null,
    status: null,
    error: null,
    pagination: {
        ...initialNegotiationSessionsPagination,
    },
}
