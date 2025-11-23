import { SlDialog } from '@shoelace-style/shoelace'
import { FC } from 'react'
import { useCallback, useEffect, useRef } from 'react'
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
import { getHistory, startInterviewSession } from './_store/effects'
import { resetSimulation, setSessionId } from './_store/reducer'
import useInterviewSimulation from './_store/use-interview-details'
import InterviewDrawerFooter from './drawer-footer'
import InterviewChat from './interview-chat'
import SimulationConfigurationDialog from './simulation-configuration-dialog'

const INTRO_DRAWER_CONTENT: IntroDrawerHeaderProps = {
    title: 'Interview Practice',
    description: 'Practice an interview and review your answers.',
    icon: SIMULATION_ICONS.INTERVIEW_PRACTICE,
}

export const InterviewPractice: FC = () => {
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

    useEffect(() => {
        if (!isNullish(sessionId)) {
            navigation.goToSearchParams({
                sessionId,
            })
        }
    }, [sessionId])

    return sessionId ? <InterviewChat /> : null
}

const InterviewPracticeFeature = () => {
    const [{ matches }] = useRouter()
    const routeSessionId = matches?.sessionId || null
    const dispatch = useDispatch<RootDispatch>()

    const dialogRef = useRef<SlDialog | null>(null)

    const handleExit = useCallback(() => {
        dispatch(resetSimulation())
        navigation.goToHome()
    }, [dispatch])

    const handleStart = useCallback(() => {
        dispatch(startInterviewSession())
    }, [dispatch])

    const handleConfigure = useCallback(() => {
        dialogRef.current?.show()
    }, [])

    return (
        <cover-l space="0">
            <SimulationConfigurationDialog dialogRef={dialogRef} />

            <SimulationHeader
                icon={SIMULATION_ICONS.INTERVIEW_PRACTICE}
                title="Interview Practice"
                onExit={handleExit}
            />
            <IntroDrawer
                open={isNullish(routeSessionId)}
                {...INTRO_DRAWER_CONTENT}
                footer={
                    <InterviewDrawerFooter
                        onStart={handleStart}
                        onConfigureSimulation={handleConfigure}
                    />
                }
            />
            <InterviewPractice />
        </cover-l>
    )
}

export default InterviewPracticeFeature
