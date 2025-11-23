import { FunctionComponent } from 'preact'

const InterviewDrawerFooter: FunctionComponent<{
    onConfigureSimulation: () => void
    onStart: () => void
}> = ({ onConfigureSimulation, onStart }) => {
    return (
        <cluster-l slot="footer" justify="flex-end" space="var(--s-1)">
            <sl-button variant="neutral" onClick={onConfigureSimulation}>
                <sl-icon slot="prefix" name="gear" />
                Configure
            </sl-button>

            <sl-button variant="primary" onClick={onStart}>
                <sl-icon slot="prefix" name="flag" />
                Get started
            </sl-button>
        </cluster-l>
    )
}

export default InterviewDrawerFooter
