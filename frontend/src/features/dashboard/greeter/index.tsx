import { useMemo } from 'react'
import { isNone } from '../../../utils/is-none'
import { getInitials } from '../../../utils/string'
import useAuth from '../../auth/use-auth'
import styles from './index.module.css'

const Greeter = () => {
    const { user } = useAuth()

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

    return (
        <div className={styles.greeter}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.message}>
                <h2>Welcome, {name}</h2>
                <p>Start your journey by going through the whole process from prepping for the interview to negotiating your offer.</p>
            </div>
        </div>
    )
}

export default Greeter
