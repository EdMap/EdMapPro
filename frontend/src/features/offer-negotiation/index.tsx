import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import IntroDrawer, {
    IntroDrawerHeaderProps,
} from '../../components/intro-drawer'
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
import NegotiationDrawerFooter from './drawer-footer'
import InitialOffer from './offer'

const INTRO_DRAWER_CONTENT: IntroDrawerHeaderProps = {
    title: 'Offer Negotiation',
    description: 'Practice negotiating a job offer.',
    icon: SIMULATION_ICONS.OFFER_NEGOTIATION,
}

const OfferNegotiation = () => {
    const [{ matches }] = useRouter()
    const routeSessionId = matches?.sessionId || null
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
    const [{ matches }] = useRouter()
    const routeSessionId = matches?.sessionId || null
    const dispatch = useDispatch<RootDispatch>()

    const handleExit = useCallback(() => {
        dispatch(resetOfferNegotiation())
        navigation.goToHome()
    }, [dispatch])

    const handleStart = useCallback(() => {
        dispatch(startNegotiationSession())
    }, [dispatch])

    return (
        <cover-l space="0">
            <SimulationHeader
                icon={SIMULATION_ICONS.OFFER_NEGOTIATION}
                title="Offer Negotiation"
                onExit={handleExit}
            />

            <IntroDrawer
                open={isNullish(routeSessionId)}
                footer={<NegotiationDrawerFooter onStart={handleStart} />}
                {...INTRO_DRAWER_CONTENT}
            />

            <OfferNegotiation />
        </cover-l>
    )
}

export default OfferNegotiationFeature
