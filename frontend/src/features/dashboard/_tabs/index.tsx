import { useRouter } from 'preact-router'
import {
    useCallback,
    useContext,
    useLayoutEffect,
    useState,
} from 'preact/hooks'
import { isNullish } from '../../../utils'
import { DEVICE_SIZE } from '../../../utils/device-sizes'
import { useResizeObserver } from '../../../utils/use-resize-observer'
import { AppContext } from '../../app/context'
import navigation from '../../app/navigation'
import { DashboardTabs } from '../models'
import TabHeaders from './headers'
import styles from './index.module.css'
import TabPanels from './panels'

const isValidTab = (tab: string) =>
    Object.values(DashboardTabs).includes(tab as DashboardTabs)

const TabGroup = () => {
    const [{ matches }] = useRouter()
    const activeTab = matches?.tab ?? null

    const [isDesktop, setIsDesktop] = useState(true)
    const { containerElRef } = useContext(AppContext)
    const layoutSize = useResizeObserver(containerElRef)

    useLayoutEffect(() => {
        if (layoutSize < DEVICE_SIZE.TABLET) {
            setIsDesktop(false)
        } else {
            setIsDesktop(true)
        }
    }, [layoutSize])

    useLayoutEffect(() => {
        if (isNullish(activeTab) || !isValidTab(activeTab!)) {
            navigation.goToSearchParams({
                tab: DashboardTabs.SIMULATIONS_MAP,
            })
        }
    }, [activeTab])

    const handleTabChange = useCallback((e: CustomEvent) => {
        navigation.goToSearchParams(
            {
                tab: e.detail.name,
            },
            new URL(globalThis.location.href),
            { clearSearch: true },
        )
    }, [])

    return (
        <sl-tab-group
            placement={isDesktop ? 'start' : 'top'}
            activation="auto"
            class={styles.wrapper}
            onsl-tab-show={handleTabChange}
        >
            <TabHeaders />
            <TabPanels />
        </sl-tab-group>
    )
}

export default TabGroup
