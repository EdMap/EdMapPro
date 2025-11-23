import { useRouter } from 'preact-router'
import { useEffect } from 'preact/hooks'

export const ScrollToTop = () => {
    const [{ path, matches, ...rest }] = useRouter()
    const offset = matches?.offset

    useEffect(() => {
        globalThis.scrollTo(0, 0)
    }, [path, offset, rest])

    return null
}
