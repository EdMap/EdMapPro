import styles from './index.module.css'

interface LogoProps {
    size?: string
}

const Logo = ({ size = 'small' }: LogoProps) => (
    <div className={`${styles.logo} ${styles[size]}`}>
        <img src="/assets/icons/_app:logo.svg" alt="EdMap Logo" />
    </div>
)

export default Logo
