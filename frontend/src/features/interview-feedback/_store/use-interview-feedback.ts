import { useSelector } from 'react-redux'
import { RootState } from '../../app/_store'
import { InterviewFeedbackState } from './state'

const useInterviewFeedback = (): InterviewFeedbackState => {
    return useSelector((state: RootState) => state['interview-feedback'])
}

export default useInterviewFeedback
