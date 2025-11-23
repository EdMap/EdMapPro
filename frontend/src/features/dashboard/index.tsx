import { FunctionComponent } from 'preact'
import { ScrollToTop } from '../../components/scroll-to-top'
import { isNone } from '../../utils/is-none'
import useAuth from '../auth/use-auth'
import TabGroup from './_tabs'
import AccountForm from './account-form'
import Greeter from './greeter'
import Header from './header'
import styles from './index.module.css'

const Dashboard: FunctionComponent = () => {
    const { user } = useAuth()
    // TODO (hom): Add new user
    const isNewUser = isNone(user?.get_full_name)

    return (
        <cover-l class={styles.dashboard}>
            <ScrollToTop />
            {isNewUser ? (
                <AccountForm />
            ) : (
                <>
                    <Header />
                    <Greeter />
                    <TabGroup />
                </>
            )}
        </cover-l>
    )
}

export default Dashboard
