import { ErrorDto } from './models'

export const UNKNOWN_ERROR: ErrorDto = {
    code: 'app.unknown',
    message: 'An unknown error occurred',
}

export const AUTHENTICATION_STORAGE: ErrorDto = {
    code: 'app.authentication.storage',
    message: 'Failed to get a token from the authentication storage',
}

export const AUTHENTICATION_TOKEN_REFRESH: ErrorDto = {
    code: 'app.authentication.refresh',
    message: 'Failed to refresh the authentication token',
}

export const AUTHENTICATION_REQUIRED: ErrorDto = {
    code: 'app.authentication.required',
    message: 'Authentication required - please sign in',
}

export const NOT_FOUND: ErrorDto = {
    code: 'app.not-found',
    message: 'URL not found',
}

export const FORBIDDEN: ErrorDto = {
    code: 'app.forbidden',
    message: 'Permission denied',
}

export const CLIENT_ERROR: ErrorDto = {
    code: 'app.client',
    message: 'Bad request',
}

export const SERVER_ERROR: ErrorDto = {
    code: 'app.api',
    message: 'The api returned an error',
}

export const CONFLICT: ErrorDto = {
    code: 'app.conflict',
    message: 'Referenced by another entity - cannot perform operation.',
}
