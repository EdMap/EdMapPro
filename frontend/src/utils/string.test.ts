import { describe, expect, it } from 'vitest'
import { getInitials, keyify, makeLabel } from './string'

describe('string', () => {
    describe('makeLabel()', () => {
        describe('when passed a camelCase string', () => {
            it('should match all the capital letters and split with the space', () => {
                const camelCaseWord = 'CamelCaseWord'
                const actual = makeLabel(camelCaseWord)
                const expected = 'Camel Case Word'
                expect(actual).toEqual(expected)
            })
        })
        describe('when passed a lowercase string', () => {
            it('should return as is', () => {
                const normalString = 'normalstring'
                const actual = makeLabel(normalString)
                const expected = normalString
                expect(actual).toEqual(expected)
            })
        })

        describe('when passed an uppercase string', () => {
            it('should return as is', () => {
                const normalString = 'NORMALSTRING'
                const actual = makeLabel(normalString)
                const expected = normalString
                expect(actual).toEqual(expected)
            })
        })
    })

    // TODO (hom) -> Add more test cases
    describe('keyify()', () => {
        describe('when passed a string with spaces', () => {
            it('should remove the spaces and concat string with underscores', () => {
                const spacedString = 'Spaced String'
                const actual = keyify(spacedString)
                const expected = 'spaced_string'
                expect(actual).toEqual(expected)
            })
        })
    })

    describe('getInitials()', () => {
        it('should return the uppercase initials of a name', () => {
            expect(getInitials('John Doe')).toEqual('JD')
        })

        it('should return one letter if only one name is provided', () => {
            expect(getInitials('John')).toEqual('J')
        })

        it('should return an empty string if no name is provided', () => {
            expect(getInitials('')).toEqual('')
        })

        it('should return max two letters - first and last - if name has more than two parts', () => {
            expect(getInitials('John Anita Doe')).toEqual('JD')
        })
    })
})
