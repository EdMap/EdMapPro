import { jwtDecode, JwtPayload } from 'jwt-decode'
import { FunctionComponent } from 'preact'
import { route } from 'preact-router'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { useDispatch } from 'react-redux'
import { isNone, isNullish } from '../../utils'
import { RootDispatch } from '../app/_store'
import { Status } from '../app/_store/state'
import { APP_ROUTES } from '../app/routes'
import { profile, refreshToken } from './_store/effects'
import { logout } from './_store/reducer'
import { ACCESS_TOKEN } from './_store/state'
import useAuth from './use-auth'

type DecodePayload = JwtPayload & {
    token_type: 'refresh' | 'access'
}

export const RequireAuth: FunctionComponent = ({ children }) => {
    const dispatch = useDispatch<RootDispatch>()
    const { status, error, token, refresh } = useAuth()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const isSuccess = status === Status.SUCCESS

    const refreshTimerRef = useRef<number | undefined>()

    const handleRefresh = useCallback(() => {
        const token = globalThis.localStorage.getItem(ACCESS_TOKEN)

        if (!isNone(token)) {
            dispatch(refreshToken())
        }
    }, [dispatch])

    const handleTokenValidation = useCallback(() => {
        const decodedRefreshToken = jwtDecode(refresh!) as DecodePayload
        const decodedAccessToken = jwtDecode(token!) as DecodePayload

        if (
            decodedRefreshToken.token_type !== 'refresh' ||
            decodedAccessToken.token_type !== 'access'
        ) {
            throw new Error('Invalid Token')
        }

        const tokenExpirationDate = decodedAccessToken.exp!
        const refreshTokenExpirationDate = decodedRefreshToken.exp!

        const now = Date.now() / 1000

        if (refreshTokenExpirationDate > now) {
            if (tokenExpirationDate > now) {
                setIsAuthenticated(true)

                refreshTimerRef.current = globalThis.setTimeout(
                    handleRefresh,
                    (tokenExpirationDate - now) * 1000,
                )

                return
            }
            handleRefresh()
        } else {
            throw new Error('Authentication required')
        }
    }, [token, refresh, handleRefresh])

    useEffect(() => {
        try {
            if (error && status === Status.ERROR) {
                throw new Error(error)
            }

            handleTokenValidation()
        } catch (err) {
            setIsAuthenticated(false)
            dispatch(logout())
            route(APP_ROUTES.LOGIN)
        }

        return () => {
            globalThis.clearTimeout(refreshTimerRef.current)
        }
    }, [error, status, handleTokenValidation, dispatch])

    useEffect(() => {
        if (isAuthenticated && isSuccess && !isNone(token)) {
            dispatch(profile())
        }
    }, [isAuthenticated, isSuccess, token, dispatch])

    return !isNullish(token) && isAuthenticated ? <>{children}</> : null
}
