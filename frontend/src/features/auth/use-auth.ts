import { useSelector } from 'react-redux'
import { RootState } from '../app/_store'
import { AuthState } from './_store/state'

const useAuth = (): AuthState => {
    return useSelector((state: RootState) => state.auth)
}

export default useAuth
