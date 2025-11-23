import { FC } from 'react'
import { RequireAuth } from '../features/auth/require-auth'
import NegotiationFeedbackFeature from '../features/negotiation-feedback'

const NegotiationFeedbackPage: FC = () => {
    return (
        <RequireAuth>
            <NegotiationFeedbackFeature />
        </RequireAuth>
    )
}

export default NegotiationFeedbackPage
