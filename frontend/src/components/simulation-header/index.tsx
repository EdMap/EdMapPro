import { FC } from 'react'
import { useCallback } from 'react'
import CircleIcon from '../circle-icon'
import styles from './index.module.css'

const SimulationHeader: FC<{
    title: string
    icon: string
    onExit: () => void
}> = ({ title, icon, onExit }) => {
    const handleExit = useCallback(() => {
        onExit()
    }, [onExit])

    return (
        <cluster-l justify="space-between" class={styles.header} align="center">
            <cluster-l space="var(--s-1)" align="center">
                <CircleIcon class={styles.icon} variant="primary" icon={icon} />
                <h3>{title}</h3>
            </cluster-l>

            <sl-button outline onClick={handleExit}>
                <sl-icon slot="prefix" name="box-arrow-left" />
                Exit Simulation
            </sl-button>
        </cluster-l>
    )
}

export default SimulationHeader
