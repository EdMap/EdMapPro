import { route } from 'preact-router'
import { isNullish, setSearchParams, SetSearchParamsOptions } from '../../utils'
import { APP_ROUTES } from './routes'

const goToHome = () => route(APP_ROUTES.DASHBOARD)
const goToInterviewPracticePage = () => route(APP_ROUTES.INTERVIEW_PRACTICE)
const goToJobSearchPage = () => route(APP_ROUTES.JOB_SEARCH)
const goToLoginPage = () => route(APP_ROUTES.LOGIN)
const goToRegistrationPage = () => route(APP_ROUTES.REGISTER)
const goToTestPage = () => route(APP_ROUTES.TEST_PAGE)
const goToWorkPage = () => route(APP_ROUTES.WORK)
const goToOfferNegotiation = () => route(APP_ROUTES.OFFER_NEGOTIATION)

const goToInterviewDetailsPage = (id: number | string) => {
    route(`${APP_ROUTES.INTERVIEW_PRACTICE}/?sessionId=${id}`)
}

const goToInterviewFeedbackPage = (id: string) => {
    route(`${APP_ROUTES.INTERVIEW_FEEDBACK}/?sessionId=${id}`)
}

const goToNegotiationFeedbackPage = (id: string) => {
    route(`${APP_ROUTES.NEGOTIATION_FEEDBACK}/?sessionId=${id}`)
}

const goToNegotiationDetailsPage = (id: number | string) => {
    route(`${APP_ROUTES.OFFER_NEGOTIATION}/?sessionId=${id}`)
}

const goToSearchParams = (
    params: Record<string, unknown>,
    url?: URL | null,
    options?: SetSearchParamsOptions,
) => {
    url = (!isNullish(url) ? url : new URL(globalThis.location.href)) as URL
    const next = setSearchParams(url, params, options)
    route(next.pathname + next.search)
}

const navigation = {
    goToHome,
    goToInterviewDetailsPage,
    goToInterviewFeedbackPage,
    goToInterviewPracticePage,
    goToJobSearchPage,
    goToLoginPage,
    goToNegotiationDetailsPage,
    goToNegotiationFeedbackPage,
    goToOfferNegotiation,
    goToRegistrationPage,
    goToSearchParams,
    goToTestPage,
    goToWorkPage,
}

export default navigation
