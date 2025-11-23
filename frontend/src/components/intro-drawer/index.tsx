import { FC, VNode } from 'react'
import Achievements from './achievements'
import DrawerHeader from './drawer-header'
import styles from './index.module.css'
import Instructions from './instructions'

export interface IntroDrawerProps {
    description: string
    footer: VNode
    icon: string
    open: boolean
    title: string
}

export type IntroDrawerHeaderProps = Omit<IntroDrawerProps, 'footer' | 'open'>

const IntroDrawer: FC<IntroDrawerProps> = ({
    open,
    footer,
    ...props
}) => {
    return (
        <sl-drawer open={open} class={styles.drawer} placement="start">
            <DrawerHeader {...props} />
            <stack-l space="var(--s3)">
                <Instructions />
                <Achievements />
            </stack-l>
            {footer}
        </sl-drawer>
    )
}

export default IntroDrawer
