import { FC, useMemo } from 'react'
import useAuth from '../auth/use-auth'
import { getInitials } from '../../utils/string'
import styles from './index.module.css'
import './dashboard.css'
import Header from './header'
import Greeter from './greeter'
import TabGroup from './_tabs'
import AccountForm from './account-form'
import { isNone } from '../../utils/is-none'

const Dashboard: FC = () => {
    const { user } = useAuth()
    const isNewUser = isNone(user?.get_full_name)

    return (
        <div className={styles.dashboard}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>📍</div>
                    <div className={styles.logoText}>edmap</div>
                </div>
                
                <nav className={styles.nav}>
                    <div className={styles.navSection}>
                        <h3 className={styles.navTitle}>SIMULATIONS</h3>
                        <ul className={styles.navList}>
                            <li><a href="#" className={styles.navItem}>📊 Simulations Map</a></li>
                            <li><a href="#" className={styles.navItem}>💬 Interview Sessions</a></li>
                            <li><a href="#" className={styles.navItem}>🤝 Negotiation Sessions</a></li>
                            <li><a href="#" className={styles.navItem}>🏢 Workspace Simulation</a></li>
                        </ul>
                    </div>
                    
                    <div className={styles.navSection}>
                        <h3 className={styles.navTitle}>ACCOUNT</h3>
                        <ul className={styles.navList}>
                            <li><a href="#" className={styles.navItem}>📈 Progress & Analytics</a></li>
                            <li><a href="#" className={styles.navItem}>⚙️ Settings</a></li>
                        </ul>
                    </div>
                </nav>
            </aside>

            <main className={styles.main}>
                {isNewUser ? (
                    <AccountForm />
                ) : (
                    <>
                        <Header />
                        <div className={styles.content}>
                            <Greeter />
                            <TabGroup />
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}

export default Dashboard
