import { describe, expect, it } from 'vitest'
import { isNone } from './is-none'

describe('isNone()', () => {
    describe('TRUE', () => {
        it('for NULL', () => {
            const actual = isNone(null)
            expect(actual).toBeTruthy()
        })
        it('for undefined', () => {
            const actual = isNone(undefined)
            expect(actual).toBeTruthy()
        })

        it('for ""', () => {
            const actual = isNone('')
            expect(actual).toBeTruthy()
        })
    })

    describe('FALSE', () => {
        it('for random string', () => {
            const actual = isNone('biff')
            expect(actual).toBeFalsy()
        })
        it('for 0', () => {
            const actual = isNone(0)
            expect(actual).toBeFalsy()
        })
        it('for false', () => {
            const actual = isNone(false)
            expect(actual).toBeFalsy()
        })
        it('for true', () => {
            const actual = isNone(true)
            expect(actual).toBeFalsy()
        })
        it('for a date', () => {
            const actual = isNone(new Date())
            expect(actual).toBeFalsy()
        })
    })
})
