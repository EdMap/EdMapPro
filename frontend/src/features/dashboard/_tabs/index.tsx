import { useCallback, useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isNullish } from '../../../utils'
import { DEVICE_SIZE } from '../../../utils/device-sizes'
import { useResizeObserver } from '../../../utils/use-resize-observer'
import { useContext } from 'react'
import { AppContext } from '../../app/context'
import navigation from '../../app/navigation'
import { DashboardTabs } from '../models'
import TabHeaders from './headers'
import styles from './index.module.css'
import TabPanels from './panels'

const isValidTab = (tab: string) =>
    Object.values(DashboardTabs).includes(tab as DashboardTabs)

const TabGroup = () => {
    const [searchParams] = useSearchParams()
    const activeTab = searchParams.get('tab')

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

    const handleTabChange = useCallback((tabName: string) => {
        navigation.goToSearchParams(
            {
                tab: tabName,
            },
            new URL(globalThis.location.href),
            { clearSearch: true },
        )
    }, [])

    return (
        <div className={styles.wrapper}>
            <TabHeaders activeTab={activeTab} onTabChange={handleTabChange} />
            <TabPanels activeTab={activeTab} />
        </div>
    )
}

export default TabGroup
