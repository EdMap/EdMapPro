import { FunctionComponent } from 'preact'
import { RequireAuth } from '../features/auth/require-auth'
import NegotiationFeedbackFeature from '../features/negotiation-feedback'

const NegotiationFeedbackPage: FunctionComponent = () => {
    return (
        <RequireAuth>
            <NegotiationFeedbackFeature />
        </RequireAuth>
    )
}

export default NegotiationFeedbackPage
