import { useSelector } from 'react-redux'
import { RootState } from '../../app/_store'
import { InterviewSessionsState } from './state'

const useInterviewSessions = (): InterviewSessionsState => {
    return useSelector((state: RootState) => state['interview-sessions'])
}

export default useInterviewSessions
