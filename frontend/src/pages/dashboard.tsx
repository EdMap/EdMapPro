import { FC } from 'react'
import { RequireAuth } from '../features/auth/require-auth'
import Dashboard from '../features/dashboard'

const DashboardPage: FC = () => {
    return (
        <RequireAuth>
            <Dashboard />
        </RequireAuth>
    )
}

export default DashboardPage
