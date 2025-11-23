/* eslint-disable react-hooks/exhaustive-deps */
import { EffectCallback, useEffect } from 'react'

/**
 * Custom hook that executes an effect callback only once.
 *
 * @param {EffectCallback} effect - The effect callback to execute.
 *
 * @example
 * // Example of using useOnce to perform a one-time initialization
 * const MyComponent = () => {
 *     useOnce(() => {
 *         console.log('Effect executed once.');
 *         // ... initialization logic
 *     });
 *     // ... rest of the component logic
 * };
 */
export function useOnce(effect: EffectCallback) {
    return useEffect(effect, [])
}
