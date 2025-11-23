/**
 * Generates a random number.
 *
 * @returns {number} A random number.
 * @example
 * const randomNumberResult = randomNumber();
 * // Result: 123456789 (example value, result will vary)
 */
export function randomNumber(): number {
    return Math.floor(Math.random() * 1_000_000_000_000)
}
