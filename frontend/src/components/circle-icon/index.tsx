import { FunctionComponent } from 'preact'
import { SlButtonProps } from '../../ui/shoelace/shoelace'
import styles from './index.module.css'

const CircleIcon: FunctionComponent<
    {
        icon: string
        class?: string
    } & SlButtonProps
> = ({ icon, ...props }) => {
    return (
        <sl-button {...props} circle class={styles.circleIcon}>
            <sl-icon name={icon}></sl-icon>
        </sl-button>
    )
}

export default CircleIcon
