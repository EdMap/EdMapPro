import { useContext, useLayoutEffect, useState } from 'react'
import {
    DropdownPlacement,
    SlDropDownProps,
} from '../../../ui/shoelace/shoelace'
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
    mobilePlacement?: DropdownPlacement
} & Pick<SlDropDownProps, 'stayOpenOnSelect' | 'placement'>

const SIMULATIONS: Simulation[] = [
    {
        title: SimulationMapItems.INTERVIEW_PRACTICE?.replace('-', ' '),
        description:
            'Learn to analyze company and job info before the interview',
        onClickHandler: () => navigation.goToInterviewPracticePage(),
        icon: SIMULATION_ICONS.INTERVIEW_PRACTICE,
        placement: 'top-start',
        mobilePlacement: 'left-start',
        highlighted: true,
    },
    {
        title: SimulationMapItems.OFFER_NEGOTIATION?.replace('-', ' '),
        description:
            'Learn to analyze company and job info before the interview',
        onClickHandler: navigation.goToOfferNegotiation,
        icon: SIMULATION_ICONS.OFFER_NEGOTIATION,
        placement: 'bottom-start',
        mobilePlacement: 'right-start',
        highlighted: true,
    },

    {
        title: SimulationMapItems.WORKPLACE_SIMULATION?.replace('-', ' '),
        description:
            'Learn to analyze company and job info before the interview',
        onClickHandler: navigation.goToOfferNegotiation,
        icon: SIMULATION_ICONS.WORKPLACE_SIMULATION,
        placement: 'top-start',
        mobilePlacement: 'left-start',
    },
]

const DesktopMap = () => {
    return (
        <cluster-l
            space="calc(var(--measure) / (var(--r3)))"
            className={styles.progress}
        >
            {SIMULATIONS.map((simulation) => {
                return (
                    <sl-popup
                        active
                        disabled={!simulation.highlighted}
                        distance={30}
                        key={keyify(simulation.title)}
                        placement={simulation.placement}
                        shift
                    >
                        <SimulationItem
                            title={simulation.title}
                            description={simulation.description}
                            onClick={simulation.onClickHandler}
                            disabled={!simulation.highlighted}
                        />

                        <sl-button
                            onClick={simulation.onClickHandler}
                            circle
                            disabled={!simulation.highlighted}
                            slot="anchor"
                            variant={
                                simulation.highlighted ? 'primary' : undefined
                            }
                        >
                            <sl-icon name={simulation.icon} />
                        </sl-button>
                    </sl-popup>
                )
            })}
        </cluster-l>
    )
}

const MobileMap = () => {
    return (
        <center-l>
            <stack-l
                className={styles.mobileMap}
                space="calc(var(--measure) / (var(--r3)))"
            >
                {SIMULATIONS.map((simulation) => {
                    return (
                        <sl-popup
                            active
                            disabled={!simulation.highlighted}
                            distance={40}
                            key={keyify(simulation.title)}
                            placement={simulation.mobilePlacement}
                        >
                            <SimulationItem
                                title={simulation.title}
                                description={simulation.description}
                                onClick={simulation.onClickHandler}
                                disabled={!simulation.highlighted}
                            />

                            <sl-button
                                onClick={simulation.onClickHandler}
                                circle
                                disabled={!simulation.highlighted}
                                slot="anchor"
                                variant={
                                    simulation.highlighted
                                        ? 'primary'
                                        : undefined
                                }
                            >
                                <sl-icon name={simulation.icon} />
                            </sl-button>
                        </sl-popup>
                    )
                })}
            </stack-l>
        </center-l>
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
        <cover-l
            centered="cluster-l"
            minHeight="calc(var(--measure) / var(--r2))"
            className={styles.wrapper}
        >
            {isDesktop ? <DesktopMap /> : <MobileMap />}
        </cover-l>
    )
}

export default SimulationsMap
