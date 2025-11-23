import { FC } from 'react'
import TabHeaders from './headers'

const Tabs: FC<{
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
