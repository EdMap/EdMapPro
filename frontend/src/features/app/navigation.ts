import { isNullish, setSearchParams, SetSearchParamsOptions } from '../../utils'
import { APP_ROUTES } from './routes'

let navigateFunction: ((to: string) => void) | null = null

export const setNavigate = (navigate: (to: string) => void) => {
    navigateFunction = navigate
}

const goToHome = () => navigateFunction?.(APP_ROUTES.DASHBOARD)
const goToInterviewPracticePage = () => navigateFunction?.(APP_ROUTES.INTERVIEW_PRACTICE)
const goToJobSearchPage = () => navigateFunction?.(APP_ROUTES.JOB_SEARCH)
const goToLoginPage = () => navigateFunction?.(APP_ROUTES.LOGIN)
const goToRegistrationPage = () => navigateFunction?.(APP_ROUTES.REGISTER)
const goToTestPage = () => navigateFunction?.(APP_ROUTES.TEST_PAGE)
const goToWorkPage = () => navigateFunction?.(APP_ROUTES.WORK)
const goToOfferNegotiation = () => navigateFunction?.(APP_ROUTES.OFFER_NEGOTIATION)

const goToInterviewDetailsPage = (id: number | string) => {
    navigateFunction?.(`${APP_ROUTES.INTERVIEW_PRACTICE}/?sessionId=${id}`)
}

const goToInterviewFeedbackPage = (id: string) => {
    navigateFunction?.(`${APP_ROUTES.INTERVIEW_FEEDBACK}/?sessionId=${id}`)
}

const goToNegotiationFeedbackPage = (id: string) => {
    navigateFunction?.(`${APP_ROUTES.NEGOTIATION_FEEDBACK}/?sessionId=${id}`)
}

const goToNegotiationDetailsPage = (id: number | string) => {
    navigateFunction?.(`${APP_ROUTES.OFFER_NEGOTIATION}/?sessionId=${id}`)
}

const goToSearchParams = (
    params: Record<string, unknown>,
    url?: URL | null,
    options?: SetSearchParamsOptions,
) => {
    url = (!isNullish(url) ? url : new URL(globalThis.location.href)) as URL
    const next = setSearchParams(url, params, options)
    navigateFunction?.(next.pathname + next.search)
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
