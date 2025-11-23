import { PaginationControls } from '../../features/app/_store/state'
import styles from './limiter.module.css'

const Limiter = ({
    count,
    offset,
    limit,
    limits,
    onLimitChange,
}: Pick<PaginationControls, 'limit' | 'offset'> & {
    count: number
    limits: number[]
    onLimitChange: (limit: number) => void
}) => {
    const itemFrom = offset! + 1
    const itemTo = offset! + count

    return (
        <sl-dropdown placement="top">
            <sl-button slot="trigger" className={styles.trigger} variant="default">
                <sl-icon slot="suffix" name="chevron-down"></sl-icon>
                {itemFrom} - {itemTo}
            </sl-button>
            <sl-menu className={styles.menu}>
                <sl-menu-label>Items per page</sl-menu-label>
                {limits.map((l) => (
                    <sl-menu-item
                        key={l}
                        checked={l == limit}
                        onClick={() => onLimitChange(l)}
                    >
                        {l}
                    </sl-menu-item>
                ))}
            </sl-menu>
        </sl-dropdown>
    )
}

export default Limiter
