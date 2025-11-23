import { ErrorDto } from '../../api/models'
import { Status } from '../../app/_store/state'

export type InterviewFeedbackState = {
    error: ErrorDto | null
    feedback: string | null
    areas_for_improvement: string | null
    status: Status | null
}

export const initialState: InterviewFeedbackState = {
    error: null,
    feedback: null,
    areas_for_improvement: null,
    status: null,
}
