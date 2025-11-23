import { FunctionComponent } from 'preact'
import { route } from 'preact-router'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { useDispatch } from 'react-redux'
import InputField from '../../../components/field'
import Logo from '../../../components/logo'
import { isNullish } from '../../../utils'
import { RootDispatch } from '../../app/_store'
import { Status } from '../../app/_store/state'
import navigation from '../../app/navigation'
import { APP_ROUTES } from '../../app/routes'
import { login } from '../_store/effects'
import useAuth from '../use-auth'

const CONTENT = {
    TITLE: 'LOGIN',
    CTA: "Don't have an account?",
}

const LoginPage: FunctionComponent = () => {
    const dispatch = useDispatch<RootDispatch>()
    const formRef = useRef<HTMLFormElement | null>(null)
    const { status, token } = useAuth()
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    })

    const isPending = status === Status.PENDING

    const handleChange = useCallback((event: CustomEvent) => {
        const target = event.target as HTMLInputElement

        setCredentials((prevState) => {
            return {
                ...prevState,
                [`${target.name}`]: target.value,
            }
        })
    }, [])

    const handleSubmit = useCallback(
        (e: SubmitEvent) => {
            e.preventDefault()

            if (formRef.current?.checkValidity()) {
                dispatch(login(credentials))
            }
        },
        [credentials, dispatch, formRef],
    )

    useEffect(() => {
        if (!isNullish(token)) {
            route(APP_ROUTES.DASHBOARD)
        }
    }, [token])

    return (
        <stack-l space="0">
            <cover-l space="0" minHeight="80vh" centered="stack-l">
                <stack-l space="var(--s0)">
                    <center-l justify="center">
                        <Logo size="large" />
                    </center-l>
                    <center-l>
                        <h2>{CONTENT.TITLE}</h2>
                    </center-l>

                    <center-l>
                        <form onSubmit={handleSubmit} ref={formRef}>
                            <stack-l space="var(--s1)">
                                <stack-l space="var(--s-2)">
                                    <InputField
                                        label="Username"
                                        name="username"
                                        placeholder="Enter your username"
                                        required
                                        size="large"
                                        type="text"
                                        value={credentials.username}
                                        onInput={handleChange}
                                    >
                                        <sl-icon
                                            name="person-fill"
                                            slot="prefix"
                                        />
                                    </InputField>

                                    <InputField
                                        label="Password"
                                        name="password"
                                        placeholder="Enter your password"
                                        required
                                        size="large"
                                        type="password"
                                        value={credentials.password}
                                        onInput={handleChange}
                                    >
                                        <sl-icon
                                            name="key-fill"
                                            slot="prefix"
                                        />
                                    </InputField>
                                </stack-l>

                                <center-l andText>
                                    <sl-button
                                        type="submit"
                                        variant="primary"
                                        size="large"
                                        loading={isPending}
                                        disabled={isPending}
                                    >
                                        Login
                                    </sl-button>
                                </center-l>
                                <center-l andText>
                                    <stack-l space="var(--s-1)">
                                        <span>{CONTENT.CTA}</span>
                                        <center-l>
                                            <sl-button
                                                variant="default"
                                                onClick={
                                                    navigation.goToRegistrationPage
                                                }
                                            >
                                                Register
                                            </sl-button>
                                        </center-l>
                                    </stack-l>
                                </center-l>
                            </stack-l>
                        </form>
                    </center-l>
                </stack-l>
            </cover-l>
        </stack-l>
    )
}

export default LoginPage
