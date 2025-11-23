import { FC } from 'react'
import styles from './index.module.css'

const Controls: FC<{
    disabled: boolean
    onNegotiation: () => void
}> = ({ disabled, onNegotiation }) => {
    return (
        <cluster-l justify="flex-end" class={styles.footer}>
            <sl-button
                variant="primary"
                outline
                disabled={disabled}
                onClick={onNegotiation}
            >
                Negotiate the Offer
                <sl-icon slot="suffix" name="arrow-right" />
            </sl-button>
        </cluster-l>
    )
}

export default Controls
