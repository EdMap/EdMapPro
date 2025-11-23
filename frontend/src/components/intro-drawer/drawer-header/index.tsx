import { FC } from 'react'
import { IntroDrawerHeaderProps } from '..'
import CircleIcon from '../../circle-icon'
import styles from './index.module.css'

const DrawerHeader: FC<IntroDrawerHeaderProps> = ({
    title,
    description,
    icon,
}) => {
    return (
        <stack-l className={styles.header} slot="label" space="var(--s1)">
            <cluster-l
                space="var(--s-1)"
                align="flex-start"
                justify="flex-start"
            >
                <CircleIcon icon={icon} variant="primary" size="large" />
                <stack-l space="0">
                    <h3 className={styles.title}>{title}</h3>
                    <p>{description}</p>
                </stack-l>
            </cluster-l>

            <cluster-l
                align="center"
                space="var(--s-1)"
                className={styles.commitmentNote}
            >
                <sl-icon name="clock" />
                <p>15-20 minutes of commitment</p>
            </cluster-l>
        </stack-l>
    )
}

export default DrawerHeader
