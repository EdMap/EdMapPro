import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import SimulationHeader from '../../components/simulation-header'
import { isNullish } from '../../utils'
import { useOnce } from '../../utils/use-once'
import { RootDispatch } from '../app/_store'
import navigation from '../app/navigation'
import { SIMULATION_ICONS } from '../dashboard/models'
import {
    getNegotiationHistory,
    startNegotiationSession,
} from './_store/effects'
import {
    resetOfferNegotiation,
    setNegotiationSessionId,
} from './_store/reducer'
import useOfferNegotiation from './_store/use-offer-negotiation'
import NegotiationChat from './chat'
import InitialOffer from './offer'

const OfferNegotiation = () => {
    const [searchParams] = useSearchParams()
    const routeSessionId = searchParams.get('sessionId')
    const { sessionId, showNegotiation } = useOfferNegotiation()
    const dispatch = useDispatch<RootDispatch>()

    useOnce(() => {
        if (isNullish(sessionId) && !isNullish(routeSessionId)) {
            dispatch(setNegotiationSessionId(routeSessionId))
            dispatch(
                getNegotiationHistory({
                    sessionId: routeSessionId!,
                }),
            )
        }
    })

    useEffect(() => {
        if (!isNullish(sessionId)) {
            navigation.goToSearchParams({
                sessionId,
            })
        }
    }, [sessionId])

    return showNegotiation ? <NegotiationChat /> : <InitialOffer />
}

const OfferNegotiationFeature = () => {
    const [searchParams] = useSearchParams()
    const routeSessionId = searchParams.get('sessionId')
    const dispatch = useDispatch<RootDispatch>()

    const handleExit = useCallback(() => {
        dispatch(resetOfferNegotiation())
        navigation.goToHome()
    }, [dispatch])

    const handleStart = useCallback(() => {
        dispatch(startNegotiationSession())
    }, [dispatch])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <SimulationHeader
                icon={SIMULATION_ICONS.OFFER_NEGOTIATION}
                title="Offer Negotiation"
                onExit={handleExit}
            />

            {isNullish(routeSessionId) && (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>Offer Negotiation</h2>
                    <p>Practice negotiating a job offer.</p>
                    <button 
                        onClick={handleStart}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Start Offer Negotiation
                    </button>
                </div>
            )}

            <OfferNegotiation />
        </div>
    )
}

export default OfferNegotiationFeature
