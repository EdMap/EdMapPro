import { isNullish } from './is-nullish'

/**
 * Converts the given input to a number, returning undefined if the conversion is not possible.
 *
 * @param {unknown} input - The value to convert to a number.
 * @returns {number | undefined} The converted number or undefined if conversion is not possible.
 * @example
 * const numericString = '42';
 * const resultFromNumericString = convertToNumber(numericString);
 * console.log(resultFromNumericString); // Output: 42
 *
 * const nonNumericString = 'abc';
 * const resultFromNonNumericString = convertToNumber(nonNumericString);
 * console.log(resultFromNonNumericString); // Output: undefined
 *
 * const nullValue = null;
 * const resultFromNullValue = convertToNumber(nullValue);
 * console.log(resultFromNullValue); // Output: undefined
 *
 * const undefinedValue = undefined;
 * const resultFromUndefinedValue = convertToNumber(undefinedValue);
 * console.log(resultFromUndefinedValue); // Output: undefined
 */
export function convertToNumber(input: unknown): number | undefined {
    if (typeof input === 'string' && input.trim() === '') {
        return undefined
    }

    if (isNullish(input)) {
        return undefined
    }

    const converted = Number(input)

    if (isNaN(converted)) {
        return undefined
    }

    return converted
}
