import { useSelector } from 'react-redux'
import { RootState } from '../../app/_store'
import { OfferNegotiationState } from './state'

const useOfferNegotiation = (): OfferNegotiationState => {
    return useSelector((state: RootState) => state['offer-negotiation'])
}

export default useOfferNegotiation
