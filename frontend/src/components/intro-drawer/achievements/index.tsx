import { keyify } from '../../../utils/string'
import styles from './index.module.css'
import AchievementItem from './item'

const CONTENT = {
    TITLE: `What you’ll learn from this simulation`,
    ITEMS: [
        {
            label: `Practice common interview questions`,
            description: 'description',
        },
        {
            label: `Review your answers and get tips and recommendations`,
            description: 'description',
        },
    ],
}

const Achievements = () => {
    return (
        <stack-l space="var(--s-2)" className={styles.achievements}>
            <h3>{CONTENT.TITLE}</h3>
            {CONTENT.ITEMS.map((item) => {
                return (
                    <AchievementItem
                        key={keyify(item.label)}
                        title={item.label}
                        description={item.description}
                    />
                )
            })}
        </stack-l>
    )
}

export default Achievements
