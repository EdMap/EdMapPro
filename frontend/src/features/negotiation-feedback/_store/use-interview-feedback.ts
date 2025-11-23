import { useSelector } from 'react-redux'
import { RootState } from '../../app/_store'
import { NegotiationFeedbackState } from './state'

const useNegotiationFeedback = (): NegotiationFeedbackState => {
    return useSelector((state: RootState) => state['negotiation-feedback'])
}

export default useNegotiationFeedback
