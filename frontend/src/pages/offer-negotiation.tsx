import { FC } from 'react'
import { RequireAuth } from '../features/auth/require-auth'
import OfferNegotiation from '../features/offer-negotiation'

const OfferNegotiationPage: FC = () => {
    return (
        <RequireAuth>
            <OfferNegotiation />
        </RequireAuth>
    )
}

export default OfferNegotiationPage
