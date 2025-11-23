import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { isNone } from '../../../../utils/is-none'
import { getInitials } from '../../../../utils/string'
import { logout } from '../../../auth/_store/reducer'
import useAuth from '../../../auth/use-auth'
import styles from './index.module.css'

const User = () => {
    const { user } = useAuth()
    const dispatch = useDispatch()

    const initials = useMemo(() => {
        const ins = !isNone(user?.get_full_name)
            ? user?.get_full_name
            : user?.username

        return getInitials(ins)
    }, [user])

    const name = useMemo(
        () => (!isNone(user?.first_name) ? user?.first_name : user?.username),
        [user],
    )

    const handleLogout = useCallback(() => {
        dispatch(logout())
    }, [dispatch])

    return (
        <sl-dropdown placement="bottom-end" class={styles.user}>
            <sl-button slot="trigger" caret size="large">
                <sl-avatar slot="prefix" initials={initials} />
                {name}
            </sl-button>

            <sl-menu>
                <sl-menu-item onClick={handleLogout}>Logout</sl-menu-item>
            </sl-menu>
        </sl-dropdown>
    )
}

export default User
