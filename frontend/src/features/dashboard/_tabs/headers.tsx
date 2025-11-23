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

const TabHeaders = () => {
    const [{ matches }] = useRouter()
    const activeTab = matches?.tab

    return (
        <>
            {(Object.keys(DashboardTabs) as DashboardTabsString[]).map(
                (key) => {
                    const { disabled } =
                        DashboardTabsContent[DashboardTabs[key]] ??
                        DashboardTabsContentDefault

                    return (
                        <sl-tab
                            key={keyify(key)}
                            panel={DashboardTabs[key]}
                            slot="nav"
                            disabled={disabled}
                            active={activeTab === DashboardTabs[key]}
                        >
                            <sl-menu-item disabled={disabled}>
                                <sl-icon
                                    name={
                                        toDashboardTabsIcons[DashboardTabs[key]]
                                    }
                                    slot="prefix"
                                />
                                {(key.includes('_')
                                    ? key.replace('_', ' ')
                                    : key
                                )?.toLowerCase()}
                            </sl-menu-item>
                        </sl-tab>
                    )
                },
            )}
        </>
    )
}

export default TabHeaders
