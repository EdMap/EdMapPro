import { describe, expect, it } from 'vitest'
import { formatDate } from './date.js'

const LOCALE = 'en-US'
const TIMEZONE = 'UTC'

describe('date', () => {
    describe('formatDate()', () => {
        describe('when passed a date string', () => {
            it('should return formatted date in en-US', () => {
                const d = new Date('2022-02-09T06:58:00Z')
                const actual = formatDate(d.toString(), LOCALE, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: TIMEZONE,
                    hour12: false,
                })
                const expected = 'Feb 9 2022 06:58'
                expect(actual).to.equal(expected)
            })
        })

        describe('when passed a nullish value', () => {
            it('should return null', () => {
                const actual = formatDate(null)
                const expected = null
                expect(actual).to.equal(expected)
            })
        })

        describe('when passed a date string with options', () => {
            it('should return formatted date in en-US', () => {
                const d = new Date('2022-02-09T06:58:00Z')
                const actual = formatDate(d?.toString(), LOCALE, {
                    timeZone: TIMEZONE,
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour12: false,
                })
                const expected = '02/09/2022'
                expect(actual).to.equal(expected)
            })

            it('should return short formatted time', () => {
                const d = new Date('2022-02-09T06:58:00Z')
                const actual = formatDate(d, LOCALE, {
                    timeZone: TIMEZONE,
                    timeStyle: 'short',
                    hour12: false,
                })
                const expected = '06:58'
                expect(actual).to.equal(expected)
            })
        })
    })
})
