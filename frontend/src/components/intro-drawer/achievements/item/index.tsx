import { FC } from 'react'
import CircleIcon from '../../../circle-icon'
import styles from './index.module.css'

const AchievementItem: FC<{
    title: string
    description: string
}> = ({ title, description }) => {
    return (
        <cluster-l
            align="flex-start"
            justify="flex-start"
            space="var(--s-1)"
            className={styles.achievement}
        >
            <CircleIcon icon="file-earmark-text" variant="warning" />
            <stack-l space="0">
                <h4>{title}</h4>
                <p>{description}</p>
            </stack-l>
        </cluster-l>
    )
}

export default AchievementItem
