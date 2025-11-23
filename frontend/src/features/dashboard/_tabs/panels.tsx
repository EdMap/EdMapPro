import { keyify } from '../../../utils/string'
import { DashboardTabs, DashboardTabsString } from '../models'
import {
    DashboardTabsContent,
    DashboardTabsContentDefault,
} from './to-dashboard-content'

const TabPanels = () => {
    const [{ matches }] = useRouter()
    const activeTab = matches?.tab

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
