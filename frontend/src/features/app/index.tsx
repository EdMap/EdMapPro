import { FunctionComponent } from 'preact'
import Router from 'preact-router'
import { Provider as StoreProvider } from 'react-redux'
import { ScrollToTop } from '../../components/scroll-to-top'
import PageNotFound from '../../pages/404'
import DashboardPage from '../../pages/dashboard'
import InterviewFeedbackPage from '../../pages/interview-feedback'
import InterviewPracticePage from '../../pages/interview-practice'
import NegotiationFeedbackPage from '../../pages/negotiation-feedback'
import OfferNegotiationPage from '../../pages/offer-negotiation'
import TestPage from '../../pages/test'
import LoginPage from '../auth/login'
import RegistrationPage from '../auth/register'
import { store } from './_store/index'
import { AppContextProvider } from './context'
import { APP_ROUTES } from './routes'
import { AppConfigProvider } from './use-config'

const AppRouter: FunctionComponent = () => {
    return (
        <Router>
            <LoginPage path={APP_ROUTES.LOGIN} />
            <RegistrationPage path={APP_ROUTES.REGISTER} />
            <TestPage path={APP_ROUTES.TEST_PAGE} />
            <DashboardPage path={APP_ROUTES.DASHBOARD} />
            <InterviewPracticePage path={APP_ROUTES.INTERVIEW_PRACTICE} />
            <InterviewFeedbackPage path={APP_ROUTES.INTERVIEW_FEEDBACK} />
            <OfferNegotiationPage path={APP_ROUTES.OFFER_NEGOTIATION} />
            <NegotiationFeedbackPage path={APP_ROUTES.NEGOTIATION_FEEDBACK} />
            <PageNotFound default />
        </Router>
    )
}

const App = () => {
    return (
        <AppContextProvider>
            <AppConfigProvider>
                <StoreProvider store={store}>
                    <ScrollToTop />
                    <AppRouter />
                </StoreProvider>
            </AppConfigProvider>
        </AppContextProvider>
    )
}

export default App
