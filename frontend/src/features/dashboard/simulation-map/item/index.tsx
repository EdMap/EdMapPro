import { FC } from 'react'
import { useCallback } from 'react'
import styles from './index.module.css'

const SimulationItem: FC<{
    title: string
    description: string
    onClick: () => void
    disabled: boolean
}> = ({ title, description, onClick, disabled }) => {
    const handleClick = useCallback(() => {
        onClick()
    }, [onClick])

    return (
        <stack-l space="var(--s-2)" class={styles.item} disabled={disabled}>
            <h4 class={styles.title}>{title}</h4>
            <p>{description}</p>
            <cluster-l justify="flex-start">
                <sl-button outline onClick={handleClick} disabled={disabled}>
                    Start simulation
                    <sl-icon slot="suffix" name="box-arrow-up-right"></sl-icon>
                </sl-button>
            </cluster-l>
        </stack-l>
    )
}

export default SimulationItem
