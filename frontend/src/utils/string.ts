import { isNullish } from './is-nullish'

/**
 * Converts a string to a key-like format by replacing spaces with underscores and converting to lowercase.
 *
 * @param {string | undefined} el - The input string.
 * @returns {string | undefined} The key-like formatted string.
 * @example
 * const input = 'This is an Example';
 * const keyFormatted = keyify(input);
 * console.log(keyFormatted); // Result: 'this_is_an_example'
 */
export function keyify(el?: string) {
    const matchedSpaces = el?.split(' ')

    if (matchedSpaces && matchedSpaces.length) {
        return matchedSpaces?.join('_')?.toLowerCase()
    }

    return el
}

/**
 * Converts a camelCase string to a human-readable label by inserting spaces.
 *
 * @param {string | undefined} el - The input string.
 * @returns {string | undefined} The human-readable label.
 * @example
 * const input = 'camelCaseString';
 * const readableLabel = makeLabel(input);
 * console.log(readableLabel); // Result: 'camel Case String'
 */
export function makeLabel(el?: string) {
    const matchedCamelCase = el?.match(/[A-Z][a-z]+/g)

    if (matchedCamelCase && matchedCamelCase.length) {
        return matchedCamelCase?.join(' ')
    }

    return el
}

/**
 * Extracts initials from a full name string.
 *
 * @param {string | undefined} fullName - The full name string.
 * @returns {string | undefined} The initials extracted from the full name.
 * @example
 * const name = 'John Doe';
 * const initials = getInitials(name);
 * console.log(initials); // Result: 'JD'
 */
export function getInitials(fullName?: string) {
    if (!isNullish(fullName)) {
        const arrayOfWords = fullName!
            .trim()
            .split(' ')
            .map((word) => word.charAt(0))
        let initials = arrayOfWords[0] ?? ''
        if (arrayOfWords.length >= 2) {
            initials += arrayOfWords.at(-1)!
        }
        return initials.toUpperCase()
    }
    return fullName
}
