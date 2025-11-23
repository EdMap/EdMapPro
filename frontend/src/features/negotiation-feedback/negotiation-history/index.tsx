import { useRouter } from 'preact-router'
import { useDispatch } from 'react-redux'
import SimulationChat from '../../../components/simulation-chat'
import { isNullish } from '../../../utils'
import { useOnce } from '../../../utils/use-once'
import { RootDispatch } from '../../app/_store'
import { Status } from '../../app/_store/state'
import NegotiationMessage from '../../interview-practice/interview-message'
import { getNegotiationHistory } from '../../offer-negotiation/_store/effects'
import { setNegotiationSessionId } from '../../offer-negotiation/_store/reducer'
import useOfferNegotiation from '../../offer-negotiation/_store/use-offer-negotiation'

const NegotiationMessages = () => {
    const { messages, status } = useOfferNegotiation()
    const isPending = status === Status.PENDING

    return (
        <stack-l space="var(--s-2)">
            {messages.map((message) => {
                return (
                    <NegotiationMessage
                        key={message.id}
                        message={message}
                        isPending={isPending}
                        showQuestionReason={true}
                    />
                )
            })}
        </stack-l>
    )
}

const NegotiationHistory = () => {
    const [{ matches }] = useRouter()
    const routeSessionId = matches?.sessionId || null
    const { sessionId } = useOfferNegotiation()

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

    return <SimulationChat messages={<NegotiationMessages />} />
}

export default NegotiationHistory
