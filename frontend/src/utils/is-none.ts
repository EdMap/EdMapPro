import { isNullish } from './is-nullish'

export function isNone(s: unknown) {
    return isNullish(s) || s === ''
}
