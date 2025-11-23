import { describe, expect, it } from 'vitest'
import { convertToNumber } from './number'

describe('number', () => {
    describe('convertToNumber()', () => {
        const testCases = ['', 'hello', '20', undefined, null]
        const expected = [undefined, undefined, 20, undefined, undefined]

        it('should map trough test cases and convert to number or undefined', () => {
            const actual = testCases.map((input) => convertToNumber(input))
            expect(actual).toEqual(expected)
        })
        it('Empty String should return undefined', () => {
            expect(convertToNumber(' ')).toBe(undefined)
        })
        it("'123' should return 123", () => {
            expect(convertToNumber('123')).toBe(123)
        })
        it("'+123' should return 123", () => {
            expect(convertToNumber('+123')).toBe(123)
        })
        it("'-123' should return -123", () => {
            expect(convertToNumber('-123')).toBe(-123)
        })
        it("'123.45' should return 123.45", () => {
            expect(convertToNumber('123.45')).toBe(123.45)
        })

        it("'-123.45' should return -123.45", () => {
            expect(convertToNumber('-123.45')).toBe(-123.45)
        })
        it("'12e5' should return 1200000", () => {
            expect(convertToNumber('12e5')).toBe(1200000)
        })
        it("'12e-5' should return 0.00012", () => {
            expect(convertToNumber('12e-5')).toBe(0.00012)
        })
        it("'0123' should return 123", () => {
            expect(convertToNumber('0123')).toBe(123)
        })
        it("'0000123' should return 123", () => {
            expect(convertToNumber('0000123')).toBe(123)
        })
        it("'0b111' should return 7", () => {
            expect(convertToNumber('0b111')).toBe(7)
        })
        it("'0o10' should return 8", () => {
            expect(convertToNumber('0o10')).toBe(8)
        })
        it("'0xBABE' should return 47806", () => {
            expect(convertToNumber('0xBABE')).toBe(47806)
        })
        it("'12e999' should return Infinity", () => {
            expect(convertToNumber('12e999')).toBe(Infinity)
        })
        it("'123foo' should return undefined", () => {
            expect(convertToNumber('123foo')).toBe(undefined)
        })
        it("'123.45foo' should return undefined", () => {
            expect(convertToNumber('123.45foo')).toBe(undefined)
        })
        it("' 123 ' should return undefined", () => {
            expect(convertToNumber(' 123 ')).toBe(123)
        })
        it("'foo' should return undefined", () => {
            expect(convertToNumber('foo')).toBe(undefined)
        })
        it("'12e' should return undefined", () => {
            expect(convertToNumber('12e')).toBe(undefined)
        })
        it("'0b567' should return undefined", () => {
            expect(convertToNumber('0b567')).toBe(undefined)
        })
        it("'0o999' should return undefined", () => {
            expect(convertToNumber('0b567')).toBe(undefined)
        })
        it("'0xFUZZ' should return undefined", () => {
            expect(convertToNumber('0xFUZZ')).toBe(undefined)
        })
        it("'Infintesty' should return Infinity", () => {
            expect(convertToNumber('Infinity')).toBe(Infinity)
        })
        it("'+Infintesty' should return Infinity", () => {
            expect(convertToNumber('+Infinity')).toBe(Infinity)
        })
        it("'-Infintesty' should return Infinity", () => {
            expect(convertToNumber('-Infinity')).toBe(-Infinity)
        })
        it('Infintesty should return Infinity', () => {
            expect(convertToNumber(Infinity)).toBe(Infinity)
        })
        it('null should return undefined', () => {
            expect(convertToNumber(null)).toBe(undefined)
        })
        it('undefined should return undefined', () => {
            expect(convertToNumber(undefined)).toBe(undefined)
        })
        it('true should return 1', () => {
            expect(convertToNumber(true)).toBe(1)
        })
        it('false should return 0', () => {
            expect(convertToNumber(false)).toBe(0)
        })
        it('NaN should return undefined', () => {
            expect(convertToNumber(NaN)).toBe(undefined)
        })
        it('{} should return undefined', () => {
            expect(convertToNumber({})).toBe(undefined)
        })
        it('{valueOf: function(){return 42}} should return 42', () => {
            expect(
                convertToNumber({
                    valueOf: function () {
                        return 42
                    },
                }),
            ).toBe(42)
        })
        it("{toString: function(){return '56'}} should return 56", () => {
            expect(
                convertToNumber({
                    toString: function () {
                        return '56'
                    },
                }),
            ).toBe(56)
        })
    })
})
