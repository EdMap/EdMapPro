import styles from './index.module.css'

interface LogoProps {
    size?: string
}

const Logo = ({ size = 'small' }: LogoProps) => (
    <div class={`${styles.logo} ${styles[size]}`}>
        <sl-icon slot="prefix" name="_app:logo" />
    </div>
)

export default Logo
