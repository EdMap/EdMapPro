import { FC } from 'react'

const NegotiationDrawerFooter: FC<{
    onStart: () => void
}> = ({ onStart }) => {
    return (
        <cluster-l slot="footer" justify="flex-end" space="var(--s-1)">
            <sl-button variant="primary" onClick={onStart}>
                <sl-icon slot="prefix" name="flag" />
                Get started
            </sl-button>
        </cluster-l>
    )
}

export default NegotiationDrawerFooter
