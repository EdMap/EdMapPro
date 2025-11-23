import { SimulationSessions } from '../../../__generated__/api'
import { ErrorDto } from '../../api/models'
import { PAGINATION_LIMITS } from '../../app/_store/constants'
import { Pagination, Status } from '../../app/_store/state'

export type InterviewSessionsState = {
    data: SimulationSessions[] | null
    status: Status | null
    error: ErrorDto | null
} & Pagination

export const initialInterviewSessionPagination = {
    limit: PAGINATION_LIMITS[0],
    offset: 0,
}

export const initialState: InterviewSessionsState = {
    data: null,
    status: null,
    error: null,
    pagination: {
        ...initialInterviewSessionPagination,
    },
}
