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
        if (!disabled) {
            onClick()
        }
    }, [onClick, disabled])

    return (
        <div className={`${styles.item} ${disabled ? styles.disabled : ''}`}>
            <h4 className={styles.title}>{title}</h4>
            <p className={styles.description}>{description}</p>
            <div className={styles.buttonContainer}>
                <button 
                    className={styles.button} 
                    onClick={handleClick} 
                    disabled={disabled}
                >
                    Start simulation →
                </button>
            </div>
        </div>
    )
}

export default SimulationItem
