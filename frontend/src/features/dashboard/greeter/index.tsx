import { useMemo } from 'react'
import { isNone } from '../../../utils/is-none'
import { getInitials } from '../../../utils/string'
import useAuth from '../../auth/use-auth'
import styles from './index.module.css'
import { MESSAGES } from './messages'

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
        <cluster-l class={styles.greeter} align="flex-start">
            <sl-avatar initials={initials} class={styles.avatar} />
            <stack-l space="var(--s-4)" class={styles.message}>
                <h2>
                    {MESSAGES.GREETER_HEADER}, {name}
                </h2>
                <stack-l>{MESSAGES.GREETER_MESSAGE}</stack-l>
            </stack-l>
        </cluster-l>
    )
}

export default Greeter
