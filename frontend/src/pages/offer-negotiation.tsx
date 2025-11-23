import { FunctionComponent } from 'preact'
import { RequireAuth } from '../features/auth/require-auth'
import OfferNegotiation from '../features/offer-negotiation'

const OfferNegotiationPage: FunctionComponent = () => {
    return (
        <RequireAuth>
            <OfferNegotiation />
        </RequireAuth>
    )
}

export default OfferNegotiationPage
