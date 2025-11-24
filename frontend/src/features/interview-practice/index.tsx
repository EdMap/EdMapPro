import { FC, useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import SimulationHeader from '../../components/simulation-header'
import { isNullish } from '../../utils'
import { useOnce } from '../../utils/use-once'
import { RootDispatch } from '../app/_store'
import navigation from '../app/navigation'
import { SIMULATION_ICONS } from '../dashboard/models'
import { getHistory, startInterviewSession } from './_store/effects'
import { resetSimulation, setSessionId } from './_store/reducer'
import useInterviewSimulation from './_store/use-interview-details'
import InterviewChat from './interview-chat'

const InterviewPractice: FC = () => {
    const [searchParams] = useSearchParams()
    const routeSessionId = searchParams.get('sessionId')
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
    const [searchParams] = useSearchParams()
    const routeSessionId = searchParams.get('sessionId')
    const dispatch = useDispatch<RootDispatch>()

    const handleExit = useCallback(() => {
        dispatch(resetSimulation())
        navigation.goToHome()
    }, [dispatch])

    const handleStart = useCallback(() => {
        dispatch(startInterviewSession())
    }, [dispatch])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <SimulationHeader
                icon={SIMULATION_ICONS.INTERVIEW_PRACTICE}
                title="Interview Practice"
                onExit={handleExit}
            />
            <div style={{ flex: 1, overflow: 'auto' }}>
                {isNullish(routeSessionId) && (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <h2>Interview Practice</h2>
                        <p>Practice an interview and review your answers.</p>
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
                            Start Interview Practice
                        </button>
                    </div>
                )}
                <InterviewPractice />
            </div>
        </div>
    )
}

export default InterviewPracticeFeature
