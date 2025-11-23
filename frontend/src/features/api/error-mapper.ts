/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-prototype-builtins */
import { ErrorDto } from '../../__generated__/api'
import {
    AUTHENTICATION_REQUIRED,
    CLIENT_ERROR,
    CONFLICT,
    FORBIDDEN,
    NOT_FOUND,
    SERVER_ERROR,
    UNKNOWN_ERROR,
} from './errors'
import { HttpResponse } from './models'

const isErrorDto = (candidate: any): candidate is ErrorDto => {
    return (
        !!candidate &&
        candidate.hasOwnProperty('code') &&
        candidate.hasOwnProperty('message')
    )
}

const isHttpResponse = (
    candidate: any,
): candidate is HttpResponse<unknown, unknown> => {
    return (
        !!candidate &&
        typeof candidate.ok === 'boolean' &&
        typeof candidate.status === 'number' &&
        candidate.hasOwnProperty('error')
    )
}

const jsToErrorDto = (e: Error): ErrorDto => ({
    code: `app.${e.name}`,
    message: e.message,
    errors: [{ message: e.stack }],
})

const responseToErrorDto = async (
    re: HttpResponse<unknown, ErrorDto | unknown>,
): Promise<ErrorDto> => {
    if ((re as any).json) {
        try {
            const json = await (re as any).json()
            return json
        } catch {
            // noop
        }
    }
    if (isErrorDto(re.error)) {
        return re.error
    }
    let result: ErrorDto
    if (re.status === 401) {
        result = AUTHENTICATION_REQUIRED
    } else if (re.status === 403) {
        result = FORBIDDEN
    } else if (re.status === 409) {
        result = CONFLICT
    } else if (re.status === 404) {
        result = {
            ...NOT_FOUND,
            message: `URL not found: ${re.url}`,
        }
    } else if ((re.status + '')[0] === '4') {
        result = {
            ...CLIENT_ERROR,
            code: `${CLIENT_ERROR.code}.${re.status}`,
        }
    } else if ((re.status + '')[0] === '5') {
        result = {
            ...SERVER_ERROR,
            code: `${SERVER_ERROR.code}.${re.status}`,
        }
    }
    result ??= { ...UNKNOWN_ERROR, code: `${UNKNOWN_ERROR.code}.${re.status}` }

    if (re.error instanceof Error) {
        result = { ...result, errors: [{ message: re.error.stack }] }
    }

    return result
}

export const toErrorDto = async (
    re: HttpResponse<unknown, ErrorDto | unknown> | Error | ErrorDto,
): Promise<ErrorDto> => {
    if (isErrorDto(re)) {
        return re
    }
    if (re instanceof Error) {
        return jsToErrorDto(re)
    }
    if (isHttpResponse(re)) {
        if (re.error instanceof Blob) {
            const msg = await (re as any).error.text()
            re.error = new Error(msg)
        }
        return await responseToErrorDto(re)
    }
    return UNKNOWN_ERROR
}
