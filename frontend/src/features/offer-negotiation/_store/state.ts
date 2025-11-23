import {
    NegotiationMessage,
    SessionStatusEnum,
} from '../../../__generated__/api'
import { ErrorDto } from '../../api/models'
import { Status } from '../../app/_store/state'

export type OfferNegotiationState = {
    error: ErrorDto | null
    initial_offer?: string | null
    messages: NegotiationMessage[]
    offer?: string | null
    sessionId: string | null
    sessionState?: SessionStatusEnum
    status: Status | null
    showNegotiation: boolean
}

export const initialState: OfferNegotiationState = {
    error: null,
    initial_offer: null,
    messages: [],
    offer: null,
    sessionId: null,
    sessionState: undefined,
    status: null,
    showNegotiation: false,
}
