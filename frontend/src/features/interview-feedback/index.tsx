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
    resetSimulation,
    setSessionId,
} from '../interview-practice/_store/reducer'
import useInterviewSimulation from '../interview-practice/_store/use-interview-details'
import { generateInterviewFeedback } from './_store/effects'
import { resetFeedback } from './_store/reducer'
import useInterviewFeedback from './_store/use-interview-feedback'
import Tabs from './_tabs'
import { InterviewFeedbackTabs } from './_tabs/headers'
import styles from './index.module.css'
import InterviewHistory from './interview-history'

const Skeleton = () => {
    return (
        <center-l>
            <stack-l space="var(--s-1)">
                Hang tight as we are generating the interview feedback.
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
    const { sessionId } = useInterviewSimulation()
    const { feedback, areas_for_improvement, status } = useInterviewFeedback()
    const dispatch = useDispatch<RootDispatch>()

    useOnce(() => {
        if (!isNullish(routeSessionId)) {
            dispatch(setSessionId(routeSessionId))
            dispatch(
                generateInterviewFeedback({
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
        dispatch(resetFeedback())
        dispatch(resetSimulation())
    }, [dispatch])

    const handleRetake = useCallback(() => {
        handleReset()
        navigation.goToInterviewPracticePage()
    }, [handleReset])

    const handleDone = useCallback(() => {
        handleReset()
        navigation.goToHome()
    }, [handleReset])

    const isPending = status === Status.PENDING

    return (
        <cover-l space="0">
            <SimulationHeader
                icon={SIMULATION_ICONS.INTERVIEW_PRACTICE}
                title="Interview Practice"
                onExit={handleDone}
            />
            <stack-l space="0" class={styles.tabWrapper}>
                <Tabs isPending={isPending}>
                    <sl-tab-panel name={InterviewFeedbackTabs.FEEDBACK} active>
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
                                            <h1>Interview Feedback</h1>

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
                                            <h3>Areas for improvement</h3>
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

                    <sl-tab-panel name={InterviewFeedbackTabs.REVIEW_QUESTIONS}>
                        <InterviewHistory />
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
