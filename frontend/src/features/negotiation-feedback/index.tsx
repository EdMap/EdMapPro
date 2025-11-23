import { FunctionComponent } from 'preact'
import { useRouter } from 'preact-router'
import { useCallback, useEffect } from 'preact/hooks'
import { useDispatch } from 'react-redux'
import sanitizeHtml from 'sanitize-html'
import SimulationHeader from '../../components/simulation-header'
import { isNullish } from '../../utils'
import { isNone } from '../../utils/is-none'
import { useOnce } from '../../utils/use-once'
import { RootDispatch } from '../app/_store'
import { Status } from '../app/_store/state'
import navigation from '../app/navigation'
import { SIMULATION_ICONS } from '../dashboard/models'
import {
    resetOfferNegotiation,
    setNegotiationSessionId,
} from '../offer-negotiation/_store/reducer'
import useOfferNegotiation from '../offer-negotiation/_store/use-offer-negotiation'
import { generateNegotiationFeedback } from './_store/effects'
import { resetNegotiationFeedback } from './_store/reducer'
import { default as useNegotiationFeedback } from './_store/use-interview-feedback'
import Tabs from './_tabs'
import { NegotiationFeedbackTabs } from './_tabs/headers'
import styles from './index.module.css'
import NegotiatedOffer from './negotiated-offer'
import NegotiationHistory from './negotiation-history'

const Skeleton = () => {
    return (
        <center-l>
            <stack-l space="var(--s-1)">
                Hang tight as we are generating the negotiation feedback.
                <center-l andText>
                    <h2>
                        <sl-spinner></sl-spinner>
                    </h2>
                </center-l>
            </stack-l>
        </center-l>
    )
}

const Controls: FunctionComponent<{
    disabled: boolean
    onRetake: () => void
    onDone: () => void
}> = ({ disabled, onDone, onRetake }) => {
    return (
        <cluster-l justify="flex-end" class={styles.footer}>
            <cluster-l space="var(--s-2)">
                <sl-button onClick={onRetake} disabled={disabled}>
                    <sl-icon name="arrow-repeat" slot="prefix" />
                    Repeat Simulation
                </sl-button>
                <sl-button
                    onClick={onDone}
                    variant="primary"
                    disabled={disabled}
                >
                    <sl-icon name="check" slot="prefix" />
                    Done
                </sl-button>
            </cluster-l>
        </cluster-l>
    )
}

const InterviewFeedback = () => {
    const [{ matches }] = useRouter()
    const routeSessionId = matches?.sessionId || null
    const { sessionId } = useOfferNegotiation()
    const { feedback, areas_for_improvement, status } = useNegotiationFeedback()
    const dispatch = useDispatch<RootDispatch>()

    useOnce(() => {
        if (!isNullish(routeSessionId)) {
            dispatch(setNegotiationSessionId(routeSessionId))
            dispatch(
                generateNegotiationFeedback({
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

    const handleReset = useCallback(() => {
        dispatch(resetNegotiationFeedback())
        dispatch(resetOfferNegotiation())
    }, [dispatch])

    const handleRetake = useCallback(() => {
        handleReset()
        navigation.goToOfferNegotiation()
    }, [handleReset])

    const handleDone = useCallback(() => {
        handleReset()
        navigation.goToHome()
    }, [handleReset])

    const isPending = status === Status.PENDING

    return (
        <cover-l space="0">
            <SimulationHeader
                icon={SIMULATION_ICONS.OFFER_NEGOTIATION}
                title="Offer Negotiation"
                onExit={handleDone}
            />
            <stack-l space="0" class={styles.tabWrapper}>
                <Tabs isPending={isPending}>
                    <sl-tab-panel
                        name={NegotiationFeedbackTabs.FEEDBACK}
                        active
                    >
                        <stack-l space="var(--s-2)">
                            {isPending ? (
                                <Skeleton />
                            ) : (
                                <stack-l space="var(--s-1)">
                                    {!isNone(feedback) ? (
                                        <stack-l
                                            space="var(--s-3)"
                                            class={styles.feedback}
                                        >
                                            <h1>Negotiation Feedback</h1>

                                            <div
                                                class={styles.feedback}
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeHtml(
                                                        feedback!,
                                                    ),
                                                }}
                                            ></div>
                                        </stack-l>
                                    ) : null}

                                    {!isNone(areas_for_improvement) ? (
                                        <stack-l
                                            space="var(--s-3)"
                                            class={styles.feedback}
                                        >
                                            <h3>Areas for Improvement</h3>
                                            <div
                                                class={styles.feedback}
                                                dangerouslySetInnerHTML={{
                                                    __html: sanitizeHtml(
                                                        areas_for_improvement!,
                                                    ),
                                                }}
                                            ></div>
                                        </stack-l>
                                    ) : null}
                                </stack-l>
                            )}
                        </stack-l>
                    </sl-tab-panel>

                    <sl-tab-panel name={NegotiationFeedbackTabs.OFFER}>
                        <NegotiatedOffer />
                    </sl-tab-panel>

                    <sl-tab-panel
                        name={NegotiationFeedbackTabs.REVIEW_QUESTIONS}
                    >
                        <NegotiationHistory />
                    </sl-tab-panel>
                </Tabs>
            </stack-l>

            <Controls
                disabled={isPending}
                onRetake={handleRetake}
                onDone={handleDone}
            />
        </cover-l>
    )
}

export default InterviewFeedback
