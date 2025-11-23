import { describe, expect, it } from 'vitest'
import { isNullish } from './is-nullish'

describe('isNullish()', () => {
    describe('TRUE', () => {
        it('for NULL', () => {
            const actual = isNullish(null)
            expect(actual).toBeTruthy()
        })
        it('for undefined', () => {
            const actual = isNullish(undefined)
            expect(actual).toBeTruthy()
        })
    })

    describe('FALSE', () => {
        it('for empty string', () => {
            const actual = isNullish('')
            expect(actual).toBeFalsy()
        })
        it('for 0', () => {
            const actual = isNullish(0)
            expect(actual).toBeFalsy()
        })
        it('for false', () => {
            const actual = isNullish(false)
            expect(actual).toBeFalsy()
        })
        it('for true', () => {
            const actual = isNullish(true)
            expect(actual).toBeFalsy()
        })
        it('for a date', () => {
            const actual = isNullish(new Date())
            expect(actual).toBeFalsy()
        })
    })
})
