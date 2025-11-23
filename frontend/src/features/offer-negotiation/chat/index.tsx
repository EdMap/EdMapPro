import { useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { SessionStatusEnum } from '../../../__generated__/api'
import SimulationChat from '../../../components/simulation-chat'
import { RootDispatch } from '../../app/_store'
import { Status } from '../../app/_store/state'
import navigation from '../../app/navigation'
import ChatControls from '../../interview-practice/interview-chat/controls'
import InterviewMessage from '../../interview-practice/interview-message'
import {
    sendNegotiationMessage,
    startNegotiationSession,
} from '../_store/effects'
import { resetOfferNegotiation } from '../_store/reducer'
import useOfferNegotiation from '../_store/use-offer-negotiation'
import styles from './index.module.css'

const NegotiationMessages = () => {
    const { messages, sessionState, status, sessionId } = useOfferNegotiation()
    const dispatch = useDispatch<RootDispatch>()

    const isPending = status === Status.PENDING
    const isDone = sessionState === SessionStatusEnum.Done

    const handleReset = useCallback(() => {
        dispatch(resetOfferNegotiation())
    }, [dispatch])

    const handleRetake = useCallback(() => {
        handleReset()
        dispatch(startNegotiationSession())
    }, [handleReset, dispatch])

    const handleReview = useCallback(() => {
        navigation.goToNegotiationFeedbackPage(sessionId!)
    }, [sessionId])

    return (
        <stack-l className={styles.messages} space="var(--s-2)">
            {messages.map((message) => {
                return (
                    <InterviewMessage
                        key={message.id}
                        message={message}
                        isPending={isPending}
                        showQuestionReason={false}
                    />
                )
            })}

            {isDone ? (
                <cluster-l space="var(--s-2)">
                    <sl-button onClick={handleRetake}>
                        <sl-icon name="arrow-repeat" slot="prefix" />
                        Retake Simulation
                    </sl-button>

                    <sl-button onClick={handleReview}>
                        <sl-icon name="check" slot="prefix" />
                        Review and Finish
                    </sl-button>
                </cluster-l>
            ) : null}
        </stack-l>
    )
}

const NegotiationChat = () => {
    const { sessionId, messages, sessionState, status } = useOfferNegotiation()
    const dispatch = useDispatch<RootDispatch>()

    const formRef = useRef<HTMLFormElement | null>(null)
    const isPending = status === Status.PENDING
    const isDone = sessionState === SessionStatusEnum.Done

    const onSend = useCallback(
        (message: string) => {
            dispatch(
                sendNegotiationMessage({
                    session_id: sessionId!,
                    message,
                }),
            )
        },
        [dispatch, sessionId],
    )

    return (
        <SimulationChat
            messages={<NegotiationMessages />}
            controls={
                <ChatControls
                    messages={messages}
                    disabled={isPending || isDone}
                    onSend={onSend}
                    formRef={formRef}
                />
            }
        />
    )
}

export default NegotiationChat
