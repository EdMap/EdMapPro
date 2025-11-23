import { FunctionComponent } from 'preact'
import TabHeaders from './headers'

const Tabs: FunctionComponent<{
    isPending: boolean
}> = ({ isPending, children }) => {
    return (
        <sl-tab-group activation="auto">
            <TabHeaders isPending={isPending} />
            {children}
        </sl-tab-group>
    )
}

export default Tabs
