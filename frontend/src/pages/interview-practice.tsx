import { FC } from 'react'
import { RequireAuth } from '../features/auth/require-auth'
import InterviewPractice from '../features/interview-practice'

const InterviewPracticePage: FC = () => {
    return (
        <RequireAuth>
            <InterviewPractice />
        </RequireAuth>
    )
}

export default InterviewPracticePage
