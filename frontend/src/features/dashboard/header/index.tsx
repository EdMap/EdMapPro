import Logo from '../../../components/logo'
import styles from './index.module.css'
import User from './user'

const Header = () => {
    return (
        <cluster-l justify="space-between" class={styles.header} align="center">
            <Logo />
            <User />
        </cluster-l>
    )
}

export default Header
