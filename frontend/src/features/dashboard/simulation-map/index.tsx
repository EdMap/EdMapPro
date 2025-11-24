import { useContext, useLayoutEffect, useState } from 'react'
import { DEVICE_SIZE } from '../../../utils/device-sizes'
import { keyify } from '../../../utils/string'
import { useResizeObserver } from '../../../utils/use-resize-observer'
import { AppContext } from '../../app/context'
import navigation from '../../app/navigation'
import { SIMULATION_ICONS, SimulationMapItems } from '../models'
import styles from './index.module.css'
import SimulationItem from './item'

type Simulation = {
    description: string
    icon: string
    onClickHandler: () => void
    title: string
    highlighted?: boolean
}

const SIMULATIONS: Simulation[] = [
    {
        title: SimulationMapItems.INTERVIEW_PRACTICE?.replace('-', ' '),
        description:
            'Learn to analyze company and job info before the interview',
        onClickHandler: () => navigation.goToInterviewPracticePage(),
        icon: SIMULATION_ICONS.INTERVIEW_PRACTICE,
        highlighted: true,
    },
    {
        title: SimulationMapItems.OFFER_NEGOTIATION?.replace('-', ' '),
        description:
            'Learn to analyze company and job info before the interview',
        onClickHandler: navigation.goToOfferNegotiation,
        icon: SIMULATION_ICONS.OFFER_NEGOTIATION,
        highlighted: true,
    },
    {
        title: SimulationMapItems.WORKPLACE_SIMULATION?.replace('-', ' '),
        description:
            'Learn to analyze company and job info before the interview',
        onClickHandler: navigation.goToOfferNegotiation,
        icon: SIMULATION_ICONS.WORKPLACE_SIMULATION,
    },
]

const DesktopMap = () => {
    return (
        <div className={styles.progress}>
            {SIMULATIONS.map((simulation) => {
                return (
                    <SimulationItem
                        key={keyify(simulation.title)}
                        title={simulation.title}
                        description={simulation.description}
                        onClick={simulation.onClickHandler}
                        disabled={!simulation.highlighted}
                    />
                )
            })}
        </div>
    )
}

const MobileMap = () => {
    return (
        <div className={styles.mobileMap}>
            {SIMULATIONS.map((simulation) => {
                return (
                    <SimulationItem
                        key={keyify(simulation.title)}
                        title={simulation.title}
                        description={simulation.description}
                        onClick={simulation.onClickHandler}
                        disabled={!simulation.highlighted}
                    />
                )
            })}
        </div>
    )
}

const SimulationsMap = () => {
    const [isDesktop, setIsDesktop] = useState(true)
    const { containerElRef } = useContext(AppContext)
    const layoutSize = useResizeObserver(containerElRef)

    useLayoutEffect(() => {
        if (layoutSize < DEVICE_SIZE.TABLET) {
            setIsDesktop(false)
        } else {
            setIsDesktop(true)
        }
    }, [layoutSize])

    return (
        <div className={styles.wrapper}>
            {isDesktop ? <DesktopMap /> : <MobileMap />}
        </div>
    )
}

export default SimulationsMap
