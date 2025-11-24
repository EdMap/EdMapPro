import { keyify } from '../../../utils/string'
import { DashboardTabs, DashboardTabsString } from '../models'
import {
    DashboardTabsContent,
    DashboardTabsContentDefault,
} from './to-dashboard-content'
import styles from './index.module.css'

const TabPanels = ({ activeTab }: { activeTab: string | null }) => {
    return (
        <div className={styles.tabPanels}>
            {(Object.keys(DashboardTabs) as DashboardTabsString[]).map(
                (tab) => {
                    const { content } =
                        DashboardTabsContent[DashboardTabs[tab]] ??
                        DashboardTabsContentDefault

                    return (
                        <div
                            key={keyify(DashboardTabs[tab])}
                            className={styles.tabPanel}
                            style={{ display: activeTab === DashboardTabs[tab] ? 'block' : 'none' }}
                        >
                            {content}
                        </div>
                    )
                },
            )}
        </div>
    )
}

export default TabPanels
