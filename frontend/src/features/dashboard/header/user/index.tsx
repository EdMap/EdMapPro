import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { isNone } from '../../../../utils/is-none'
import { getInitials } from '../../../../utils/string'
import { logout } from '../../../auth/_store/reducer'
import useAuth from '../../../auth/use-auth'
import styles from './index.module.css'

const User = () => {
    const { user } = useAuth()
    const dispatch = useDispatch()
    const [isOpen, setIsOpen] = useState(false)

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
        setIsOpen(false)
    }, [dispatch])

    return (
        <div className={styles.user}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={styles.avatar}>{initials}</div>
                <span>{name}</span>
                <span className={styles.caret}>▼</span>
            </button>

            {isOpen && (
                <div className={styles.menu}>
                    <button
                        className={styles.menuItem}
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}

export default User
