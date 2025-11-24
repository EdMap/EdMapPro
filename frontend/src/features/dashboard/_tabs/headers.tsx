import { keyify } from '../../../utils/string'
import {
    DashboardTabs,
    DashboardTabsString,
    toDashboardTabsIcons,
} from '../models'
import {
    DashboardTabsContent,
    DashboardTabsContentDefault,
} from './to-dashboard-content'
import styles from './index.module.css'

const TabHeaders = ({ activeTab, onTabChange }: { activeTab: string | null; onTabChange: (tab: string) => void }) => {
    return (
        <div className={styles.tabHeaders}>
            {(Object.keys(DashboardTabs) as DashboardTabsString[]).map(
                (key) => {
                    const { disabled } =
                        DashboardTabsContent[DashboardTabs[key]] ??
                        DashboardTabsContentDefault

                    return (
                        <button
                            key={keyify(key)}
                            className={`${styles.tabHeader} ${activeTab === DashboardTabs[key] ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
                            onClick={() => onTabChange(DashboardTabs[key])}
                            disabled={disabled}
                        >
                            {(key.includes('_')
                                ? key.replace('_', ' ')
                                : key
                            )?.toLowerCase()}
                        </button>
                    )
                },
            )}
        </div>
    )
}

export default TabHeaders
