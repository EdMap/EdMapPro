import { ErrorDto } from '../../api/models'
import { Status } from '../../app/_store/state'

export type NegotiationFeedbackState = {
    error: ErrorDto | null
    feedback: string | null
    areas_for_improvement: string | null
    status: Status | null
    offer: string | null
}

export const initialState: NegotiationFeedbackState = {
    error: null,
    feedback: null,
    areas_for_improvement: null,
    status: null,
    offer: null,
}
