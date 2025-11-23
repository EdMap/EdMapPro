import { describe, expect, it } from 'vitest'
import { toErrorDto } from './error-mapper'
import {
    AUTHENTICATION_REQUIRED,
    CLIENT_ERROR,
    CONFLICT,
    NOT_FOUND,
    SERVER_ERROR,
} from './errors'
import { HttpResponse } from './models'

const ERROR_CODE_BASE = 'app'
const SYNTAX_ERROR = new SyntaxError('Unexpected end of JSON input')
const ERR_INTERNET_DISCONNECTED = new TypeError('Failed to fetch')
const VALIDATION_ERROR_DTO = {
    code: 'Validation',
    message: 'Invalid input presented',
    errors: [
        {
            code: 'Input.Name',
            message: "'Input Name' must not be empty.",
            errors: null,
        },
    ],
}
const ERROR_BLOB_MESSAGE = 'tis but an error blob message'
const ERROR_BLOB = new Blob([ERROR_BLOB_MESSAGE], { type: 'text' })
ERROR_BLOB['text'] = () => Promise.resolve(ERROR_BLOB_MESSAGE)
const ERROR_RESPONSE_422 = {
    error: VALIDATION_ERROR_DTO,
    status: 422,
    ok: false,
} as HttpResponse<unknown, unknown>
const ERROR_RESPONSE_401 = {
    error: SYNTAX_ERROR,
    status: 401,
    ok: false,
} as HttpResponse<unknown, unknown>
const ERROR_RESPONSE_404 = {
    error: SYNTAX_ERROR,
    status: 404,
    ok: false,
    url: 'https://api.bonbon.guru/not/found/maybe/v2',
} as HttpResponse<unknown, unknown>
const ERROR_RESPONSE_409 = {
    error: null,
    status: 409,
    ok: false,
} as HttpResponse<unknown, unknown>
const ERROR_RESPONSE_418 = {
    data: null,
    error: null,
    status: 418,
    ok: false,
} as HttpResponse<unknown, unknown>
const ERROR_RESPONSE_503 = {
    error: undefined,
    status: 503,
    ok: false,
} as HttpResponse<unknown, unknown>
const ERROR_RESPONSE_BLOB = {
    error: ERROR_BLOB,
    status: 999,
    ok: false,
} as HttpResponse<unknown, unknown>

describe.concurrent('api error mapper', () => {
    describe('js errors', () => {
        it('should map', async () => {
            const message = 'No way Jose'
            const e = new TypeError(message)
            const actual = await toErrorDto(e)
            expect(actual).toEqual({
                code: `${ERROR_CODE_BASE}.${e.name}`,
                message,
                errors: [{ message: e.stack }],
            })
        })
    })
    describe('error dtos', () => {
        it('should pass through', async () => {
            const actual = await toErrorDto(VALIDATION_ERROR_DTO)
            expect(actual).toEqual(VALIDATION_ERROR_DTO)
        })
    })
    describe('api errors', () => {
        describe('with response body', () => {
            describe('422', () => {
                it('should extract error dto', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_422)
                    expect(actual).toEqual(VALIDATION_ERROR_DTO)
                })
            })
        })
        describe('NO response body', () => {
            describe('401', () => {
                it('should map', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_401)
                    expect(actual).toEqual({
                        ...AUTHENTICATION_REQUIRED,
                        errors: [{ message: SYNTAX_ERROR.stack }],
                    })
                })
            })
            describe('404', () => {
                it('should map code', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_404)
                    expect(actual.code).toEqual(NOT_FOUND.code)
                })
                it('should add url to message', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_404)
                    expect(actual.message).toEqual(
                        `${NOT_FOUND.message}: ${ERROR_RESPONSE_404.url}`,
                    )
                })
                it('should add stack trace as inner error message', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_404)
                    expect(actual?.errors?.[0].message).toEqual(
                        SYNTAX_ERROR.stack,
                    )
                })
            })
            describe('409', () => {
                it('should map code', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_409)
                    expect(actual.code).toEqual(CONFLICT.code)
                })
            })
            describe('418', () => {
                it('should append http status to error code', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_418)
                    expect(actual.code).toEqual(
                        `${CLIENT_ERROR.code}.${ERROR_RESPONSE_418.status}`,
                    )
                })
                it('should add error message', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_418)
                    expect(actual.message).toEqual(CLIENT_ERROR.message)
                })
            })
            describe('503', () => {
                it('should append http status to error code', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_503)
                    expect(actual.code).toEqual(
                        `${SERVER_ERROR.code}.${ERROR_RESPONSE_503.status}`,
                    )
                })
                it('should add error message', async () => {
                    const actual = await toErrorDto(ERROR_RESPONSE_503)
                    expect(actual.message).toEqual(SERVER_ERROR.message)
                })
            })
        })
    })
    describe('network errors dtos', () => {
        it('should map', async () => {
            const actual = await toErrorDto(ERR_INTERNET_DISCONNECTED)
            expect(actual).toEqual({
                code: `${ERROR_CODE_BASE}.${ERR_INTERNET_DISCONNECTED.name}`,
                message: ERR_INTERNET_DISCONNECTED.message,
                errors: [{ message: ERR_INTERNET_DISCONNECTED.stack }],
            })
        })
    })
    describe('error blobs', () => {
        it('should push error blob to child errors array', async () => {
            const actual = await toErrorDto(ERROR_RESPONSE_BLOB)
            expect(
                actual.errors?.[0].message?.startsWith(
                    `Error: ${ERROR_BLOB_MESSAGE}`,
                ),
            ).toBeTruthy()
        })
    })
})
