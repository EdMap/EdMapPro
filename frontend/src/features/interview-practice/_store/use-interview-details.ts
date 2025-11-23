import { useSelector } from 'react-redux'
import { RootState } from '../../app/_store'
import { InterviewState } from './state'

const useInterviewSimulation = (): InterviewState => {
    return useSelector((state: RootState) => state['interview-practice'])
}

export default useInterviewSimulation
