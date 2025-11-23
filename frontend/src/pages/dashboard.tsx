import { FunctionComponent } from 'preact'
import { RequireAuth } from '../features/auth/require-auth'
import Dashboard from '../features/dashboard'

const DashboardPage: FunctionComponent = () => {
    return (
        <RequireAuth>
            <Dashboard />
        </RequireAuth>
    )
}

export default DashboardPage
