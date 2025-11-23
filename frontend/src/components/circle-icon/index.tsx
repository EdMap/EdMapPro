import { FC } from 'react'
import { SlButtonProps } from '../../ui/shoelace/shoelace'
import styles from './index.module.css'

const CircleIcon: FC<
    {
        icon: string
        class?: string
    } & SlButtonProps
> = ({ icon, ...props }) => {
    return (
        <sl-button {...props} circle className={styles.circleIcon}>
            <sl-icon name={icon}></sl-icon>
        </sl-button>
    )
}

export default CircleIcon
