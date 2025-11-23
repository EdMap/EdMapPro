import { FunctionComponent } from 'preact'
import { RequireAuth } from '../features/auth/require-auth'
import InterviewFeedback from '../features/interview-feedback'

const InterviewFeedbackPage: FunctionComponent = () => {
    return (
        <RequireAuth>
            <InterviewFeedback />
        </RequireAuth>
    )
}

export default InterviewFeedbackPage
