import { describe, expect, it } from 'vitest'
import { toErrorDto } from './error-mapper'
import { HttpResponse } from './models'

const VALIDATION_ERROR_DTO = {
    code: 'Validation',
    message: 'Invalid input presented',
    errors: [
        {
            code: 'Input.Name',
            message: "'Input Name' must not be empty.",
            errors: null,
        },
        {
            code: 'Input.ValidFrom',
            message: 'Duplicate retailer configuration.',
            errors: null,
        },
    ],
}
const ERROR_RESPONSE_422 = {
    error: null,
    data: null,
    json: () => Promise.resolve(VALIDATION_ERROR_DTO),
    status: 422,
    ok: false,
} as HttpResponse<unknown, unknown>

describe.concurrent('api error mapper', () => {
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
    })
})
