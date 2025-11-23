import { useDispatch } from 'react-redux'
import SimulationChat from '../../../components/simulation-chat'
import { isNullish } from '../../../utils'
import { useOnce } from '../../../utils/use-once'
import { RootDispatch } from '../../app/_store'
import { Status } from '../../app/_store/state'
import { getHistory } from '../../interview-practice/_store/effects'
import { setSessionId } from '../../interview-practice/_store/reducer'
import useInterviewSimulation from '../../interview-practice/_store/use-interview-details'
import InterviewMessage from '../../interview-practice/interview-message'

const InterviewMessages = () => {
    const { messages, status } = useInterviewSimulation()
    const isPending = status === Status.PENDING

    return (
        <stack-l space="var(--s-2)">
            {messages.map((message) => {
                return (
                    <InterviewMessage
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

// NOTE (hom): redundant duplication
// We should always have access to the store data
// TODO (hom): this should be made into a generic and accept simulation store as a dependency
const InterviewHistory = () => {
    const [{ matches }] = useRouter()
    const routeSessionId = matches?.sessionId || null
    const { sessionId } = useInterviewSimulation()

    const dispatch = useDispatch<RootDispatch>()

    useOnce(() => {
        if (isNullish(sessionId) && !isNullish(routeSessionId)) {
            dispatch(setSessionId(routeSessionId))
            dispatch(
                getHistory({
                    sessionId: routeSessionId!,
                }),
            )
        }
    })

    return <SimulationChat messages={<InterviewMessages />} />
}

export default InterviewHistory
