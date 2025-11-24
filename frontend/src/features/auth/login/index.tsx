import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import InputField from '../../../components/field'
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

    useEffect(() => {
        dispatch(logout())
    }, [dispatch])

    const isPending = status === Status.PENDING

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const target = event.target
        setCredentials((prevState) => {
            return {
                ...prevState,
                [target.name]: target.value,
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
        [credentials, dispatch],
    )

    useEffect(() => {
        if (!isNullish(token)) {
            navigation.goToHome()
        }
    }, [token])

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.logo}>
                    <Logo size="large" />
                </div>
                <h2 className={styles.title}>{CONTENT.TITLE}</h2>

                <form onSubmit={handleSubmit} ref={formRef} className={styles.form}>
                    <div className={styles.fields}>
                        <InputField
                            id="username"
                            label="Username"
                            name="username"
                            placeholder="Enter your username"
                            required
                            type="text"
                            value={credentials.username}
                            onChange={handleChange}
                        />

                        <InputField
                            id="password"
                            label="Password"
                            name="password"
                            placeholder="Enter your password"
                            required
                            type="password"
                            value={credentials.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={isPending}
                    >
                        {isPending ? 'Logging in...' : 'Login'}
                    </button>

                    <div className={styles.register}>
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
