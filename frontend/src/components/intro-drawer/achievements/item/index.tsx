import { FunctionComponent } from 'preact'
import CircleIcon from '../../../circle-icon'
import styles from './index.module.css'

const AchievementItem: FunctionComponent<{
    title: string
    description: string
}> = ({ title, description }) => {
    return (
        <cluster-l
            align="flex-start"
            justify="flex-start"
            space="var(--s-1)"
            class={styles.achievement}
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
