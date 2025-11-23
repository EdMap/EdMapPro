import { ComponentChildren } from 'preact'
import { PaginationControls } from '../../features/app/_store/state'
import styles from './pager.module.css'

const Pager = ({
    children,
    limit,
    hasMore,
    offset,
    onOffsetChange,
}: PaginationControls & {
    count: number
    onOffsetChange: (offset: number) => void
    children: ComponentChildren
}) => {
    const prevDisabled = offset! <= 0
    const nextDisabled = !hasMore

    return (
        <sl-button-group class={styles.pager}>
            <sl-button
                disabled={prevDisabled}
                variant="default"
                onClick={
                    !prevDisabled
                        ? () => onOffsetChange(offset! - limit!)
                        : null
                }
            >
                <sl-icon slot="prefix" name="chevron-left" />
            </sl-button>
            {children}
            <sl-button
                disabled={!hasMore}
                variant="default"
                onClick={
                    !nextDisabled
                        ? () => onOffsetChange(offset! + limit!)
                        : null
                }
            >
                <sl-icon slot="prefix" name="chevron-right" />
            </sl-button>
        </sl-button-group>
    )
}

export default Pager
