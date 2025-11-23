import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

export const ScrollToTop = () => {
    const location = useLocation()

    useEffect(() => {
        globalThis.scrollTo(0, 0)
    }, [location.pathname, location.search])

    return null
}
