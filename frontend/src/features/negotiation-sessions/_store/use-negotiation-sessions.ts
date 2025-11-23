import { useSelector } from 'react-redux'
import { RootState } from '../../app/_store'
import { NegotiationSessionsState } from './state'

const useNegotiationSessions = (): NegotiationSessionsState => {
    return useSelector((state: RootState) => state['negotiation-sessions'])
}

export default useNegotiationSessions
