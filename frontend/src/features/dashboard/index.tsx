import { FC, useMemo } from 'react'
import useAuth from '../auth/use-auth'
import { getInitials } from '../../utils/string'
import styles from './index.module.css'
import './dashboard.css'

const Dashboard: FC = () => {
    const { user } = useAuth()

    const initials = useMemo(() => {
        const name = user?.first_name || user?.username || ''
        return getInitials(name)
    }, [user])

    const firstName = useMemo(
        () => user?.first_name || user?.username || 'User',
        [user]
    )

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
                <header className={styles.topHeader}>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <div className={styles.userSection}>
                        <button className={styles.notificationBtn}>🔔</button>
                        <div className={styles.userInfo}>
                            <div className={styles.avatar}>{initials}</div>
                            <span className={styles.username}>{firstName}</span>
                            <button className={styles.dropdown}>▼</button>
                        </div>
                    </div>
                </header>

                <div className={styles.content}>
                    <div className={styles.welcomeCard}>
                        <div className={styles.welcomeContent}>
                            <div className={styles.welcomeAvatar}>{initials}</div>
                            <div className={styles.welcomeText}>
                                <h2 className={styles.welcomeTitle}>Welcome, {firstName}</h2>
                                <p className={styles.welcomeMessage}>
                                    Start your journey by going through the whole process from prepping for the interview to negotiating your offer.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.cardsGrid}>
                        <div className={styles.featureCard}>
                            <div className={styles.cardIcon} style={{ backgroundColor: '#E3F2FD', color: '#2196F3' }}>💬</div>
                            <h3 className={styles.cardTitle}>Interview Practice</h3>
                            <p className={styles.cardDescription}>Learn to analyze company and job info before the interview</p>
                            <button className={styles.startBtn}>Start simulation →</button>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={styles.cardIcon} style={{ backgroundColor: '#F3E5F5', color: '#9C27B0' }}>👥</div>
                            <h3 className={styles.cardTitle}>Workplace Simulation</h3>
                            <p className={styles.cardDescription}>Learn to analyze company and job info before the interview</p>
                            <button className={styles.startBtn}>Start simulation →</button>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={styles.cardIcon} style={{ backgroundColor: '#E8F5E9', color: '#4CAF50' }}>🛡️</div>
                            <h3 className={styles.cardTitle}>Offer Negotiation</h3>
                            <p className={styles.cardDescription}>Learn to analyze company and job info before the interview</p>
                            <button className={styles.startBtn}>Start simulation →</button>
                        </div>
                    </div>

                    <div className={styles.progressSection}>
                        <h3 className={styles.progressTitle}>Your Progress</h3>
                        <div className={styles.progressCards}>
                            <div className={styles.progressCard}>
                                <div className={styles.progressIcon} style={{ backgroundColor: '#E3F2FD', color: '#2196F3' }}>✓</div>
                                <div className={styles.progressLabel}>Completed Sessions</div>
                                <div className={styles.progressValue}>0</div>
                            </div>

                            <div className={styles.progressCard}>
                                <div className={styles.progressIcon} style={{ backgroundColor: '#E8F5E9', color: '#4CAF50' }}>⭐</div>
                                <div className={styles.progressLabel}>Average Score</div>
                                <div className={styles.progressValue}>0</div>
                            </div>

                            <div className={styles.progressCard}>
                                <div className={styles.progressIcon} style={{ backgroundColor: '#FCE4EC', color: '#E91E63' }}>🕐</div>
                                <div className={styles.progressLabel}>Time Practiced</div>
                                <div className={styles.progressValue}>0h</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Dashboard
