import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import Logo from '../../../components/logo'
import { isNullish } from '../../../utils'
import { RootDispatch } from '../../app/_store'
import { Status } from '../../app/_store/state'
import navigation from '../../app/navigation'
import { login } from '../_store/effects'
import { logout } from '../_store/reducer'
import useAuth from '../use-auth'
import styles from './index.module.css'

const CONTENT = {
    TITLE: 'LOGIN',
    CTA: "Don't have an account?",
}

const LoginPage: FC = () => {
    const dispatch = useDispatch<RootDispatch>()
    const formRef = useRef<HTMLFormElement | null>(null)
    const { status, token } = useAuth()
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    })

    // Clear any stale auth state when landing on login page
    useEffect(() => {
        dispatch(logout())
    }, [dispatch])

    const isPending = status === Status.PENDING

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target

        setCredentials((prevState) => {
            return {
                ...prevState,
                [`${target.name}`]: target.value,
            }
        })
    }, [])

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()

            if (formRef.current?.checkValidity()) {
                dispatch(login(credentials))
            }
        },
        [credentials, dispatch, formRef],
    )

    useEffect(() => {
        if (!isNullish(token)) {
            navigation.goToHome()
        }
    }, [token])

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.logoWrapper}>
                    <Logo size="large" />
                </div>
                <h2 className={styles.title}>{CONTENT.TITLE}</h2>

                <form onSubmit={handleSubmit} ref={formRef} className={styles.form}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="username" className={styles.label}>Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Enter your username"
                            required
                            value={credentials.username}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            required
                            value={credentials.password}
                            onChange={handleChange}
                            className={styles.input}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={isPending}
                    >
                        {isPending ? 'Logging in...' : 'Login'}
                    </button>

                    <div className={styles.registerSection}>
                        <span>{CONTENT.CTA}</span>
                        <button
                            type="button"
                            className={styles.registerBtn}
                            onClick={navigation.goToRegistrationPage}
                        >
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default LoginPage
