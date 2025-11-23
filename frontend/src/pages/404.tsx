import { FC } from 'react'
import navigation from '../features/app/navigation'

const PageNotFound: FC = () => (
    <center-l andText style={{ marginTop: 'var(--s5)' }}>
        <stack-l>
            <sl-icon
                name="search"
                style={{ marginInline: 'auto', fontSize: 'var(--s5)' }}
            />
            <h2>404 Not Found</h2>
            <sl-button variant="neutral" outline onClick={navigation.goToHome}>
                Go Home
            </sl-button>
        </stack-l>
    </center-l>
)

export default PageNotFound
