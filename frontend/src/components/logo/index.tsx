import styles from './index.module.css'

interface LogoProps {
    size?: string
}

const Logo = ({ size = 'small' }: LogoProps) => (
    <div className={`${styles.logo} ${styles[size]}`}>
        <sl-icon slot="prefix" name="star-fill" />
    </div>
)

export default Logo
