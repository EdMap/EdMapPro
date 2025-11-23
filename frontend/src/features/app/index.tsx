import { FC, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
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
import { setNavigate } from './navigation'

const NavigateProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate()
    
    useEffect(() => {
        setNavigate(navigate)
    }, [navigate])
    
    return <>{children}</>
}

const AppRouter: FC = () => {
    return (
        <Routes>
            <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={APP_ROUTES.REGISTER} element={<RegistrationPage />} />
            <Route path={APP_ROUTES.TEST_PAGE} element={<TestPage />} />
            <Route path={APP_ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={APP_ROUTES.INTERVIEW_PRACTICE} element={<InterviewPracticePage />} />
            <Route path={APP_ROUTES.INTERVIEW_FEEDBACK} element={<InterviewFeedbackPage />} />
            <Route path={APP_ROUTES.OFFER_NEGOTIATION} element={<OfferNegotiationPage />} />
            <Route path={APP_ROUTES.NEGOTIATION_FEEDBACK} element={<NegotiationFeedbackPage />} />
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    )
}

const App = () => {
    return (
        <AppContextProvider>
            <AppConfigProvider>
                <StoreProvider store={store}>
                    <BrowserRouter>
                        <NavigateProvider>
                            <ScrollToTop />
                            <AppRouter />
                        </NavigateProvider>
                    </BrowserRouter>
                </StoreProvider>
            </AppConfigProvider>
        </AppContextProvider>
    )
}

export default App
