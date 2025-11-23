import { FunctionComponent } from 'preact'
import { RequireAuth } from '../features/auth/require-auth'
import InterviewPractice from '../features/interview-practice'

const InterviewPracticePage: FunctionComponent = () => {
    return (
        <RequireAuth>
            <InterviewPractice />
        </RequireAuth>
    )
}

export default InterviewPracticePage
