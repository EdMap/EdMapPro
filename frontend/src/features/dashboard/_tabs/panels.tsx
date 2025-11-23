import { useSearchParams } from 'react-router-dom'
import { keyify } from '../../../utils/string'
import { DashboardTabs, DashboardTabsString } from '../models'
import {
    DashboardTabsContent,
    DashboardTabsContentDefault,
} from './to-dashboard-content'

const TabPanels = () => {
    const [searchParams] = useSearchParams()
    const activeTab = searchParams.get('tab')

    return (
        <>
            {(Object.keys(DashboardTabs) as DashboardTabsString[]).map(
                (tab) => {
                    const { content } =
                        DashboardTabsContent[DashboardTabs[tab]] ??
                        DashboardTabsContentDefault

                    return (
                        <sl-tab-panel
                            name={DashboardTabs[tab]}
                            key={keyify(DashboardTabs[tab])}
                            active={activeTab === DashboardTabs[tab]}
                        >
                            {activeTab === DashboardTabs[tab] && content}
                        </sl-tab-panel>
                    )
                },
            )}
        </>
    )
}

export default TabPanels
