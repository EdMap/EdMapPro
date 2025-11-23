import {
    CareerEnum,
    InterviewMessage,
    SeniorityLevelEnum,
    SessionStatusEnum,
    StartInterviewSessionRequest,
} from '../../../__generated__/api'
import { ErrorDto } from '../../api/models'
import { Status } from '../../app/_store/state'

export type SimConfiguration = StartInterviewSessionRequest

export type InterviewState = {
    sessionId: string | null
    messages: InterviewMessage[]
    sessionState?: SessionStatusEnum
    hasFeedback: boolean
    status: Status | null
    error: ErrorDto | null
    configuration: SimConfiguration
}

export const initialState: InterviewState = {
    error: null,
    messages: [],
    sessionId: null,
    hasFeedback: false,
    sessionState: undefined,
    status: null,
    configuration: {
        company: '',
        seniority_level: '' as SeniorityLevelEnum,
        career: '' as CareerEnum,
        job_description: '',
    },
}
