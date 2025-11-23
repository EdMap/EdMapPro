import { FC } from 'react'
import { RequireAuth } from '../features/auth/require-auth'
import InterviewFeedback from '../features/interview-feedback'

const InterviewFeedbackPage: FC = () => {
    return (
        <RequireAuth>
            <InterviewFeedback />
        </RequireAuth>
    )
}

export default InterviewFeedbackPage
