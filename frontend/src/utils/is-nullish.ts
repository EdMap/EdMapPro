/**
 * Checks if the provided value is null or undefined.
 *
 * @param {unknown} obj - The value to check for nullishness.
 * @returns {boolean} True if the value is null or undefined, false otherwise.
 * @example
 * const exampleValue = null;
 * const isValueNullish = isNullish(exampleValue);
 * console.log(isValueNullish); // Output: true
 *
 * const anotherValue = 'Hello, World!';
 * const isAnotherValueNullish = isNullish(anotherValue);
 * console.log(isAnotherValueNullish); // Output: false
 */
export function isNullish(obj: unknown) {
    return typeof (obj ?? undefined) === 'undefined'
}
