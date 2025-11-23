import { FunctionComponent, VNode } from 'preact'
import styles from './index.module.css'

const SimulationChat: FunctionComponent<{
    messages: VNode
    controls?: VNode | null
}> = ({ messages, controls }) => {
    return (
        <cover-l space="0" class={styles.wrapper}>
            <stack-l space="var(--s-2)">
                {messages}
                {controls}
            </stack-l>
        </cover-l>
    )
}

export default SimulationChat
