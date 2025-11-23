import { isNullish } from './is-nullish'

/**
 * Options for setting search parameters.
 */
export type SetSearchParamsOptions = {
    clearSearch: boolean
}

const DEFAULT_SET_SEARCH_PARAMS_OPTIONS: SetSearchParamsOptions = {
    clearSearch: false,
}

/**
 * Appends search parameters to the given URL.
 *
 * @param {URL} url - The original URL.
 * @param {Record<string, string> | null} params - The parameters to append.
 * @returns {URL} The modified URL.
 * @example
 * const originalURL = new URL('https://example.com');
 * const paramsToAppend = { key1: 'value1', key2: 'value2' };
 * const modifiedURL = appendSearchParams(originalURL, paramsToAppend);
 * // Result: https://example.com?key1=value1&key2=value2 (example value, result will vary)
 */
export const appendSearchParams = (
    url: URL,
    params?: Record<string, string> | null,
): URL => {
    if (params) {
        const ps = new URLSearchParams(url.search)
        Object.entries(params).forEach(([key, value]) => ps.append(key, value))
        url.search = ps.toString()
    }
    return url
}

/**
 * Sets search parameters for the given URL.
 *
 * @param {URL} url - The original URL.
 * @param {Record<string, string | unknown> | null} params - The parameters to set.
 * @param {SetSearchParamsOptions} options - Options for setting parameters.
 * @returns {URL} The modified URL.
 * @example
 * const originalURL = new URL('https://example.com');
 * const paramsToSet = { key1: 'value1', key2: 'value2' };
 * const options = { clearSearch: true };
 * const modifiedURL = setSearchParams(originalURL, paramsToSet, options);
 * // Result: https://example.com?key1=value1&key2=value2 (example value, result will vary)
 */
export const setSearchParams = (
    url: URL,
    params?: Record<string, string | unknown> | null,
    options: SetSearchParamsOptions = DEFAULT_SET_SEARCH_PARAMS_OPTIONS,
): URL => {
    if (options?.clearSearch) {
        url.search = ''
    }
    if (params) {
        const ps = new URLSearchParams(url.search)
        Object.entries(params).forEach(([key, value]) => {
            const param = !isNullish(value) ? String(value) : ''
            return ps.set(key, param)
        })
        url.search = ps.toString().replace(/\+/g, '%20')
    }

    return url
}

/**
 * Extracts a search parameter from the given query string.
 *
 * @param {string} qp - The query parameter to extract.
 * @param {string} qs - The query string.
 * @returns {string | null} The extracted parameter value.
 * @example
 * const queryString = '?key1=value1&key2=value2';
 * const extractedParam = extractSearchParam('key1', queryString);
 * // Result: 'value1' (example value, result will vary)
 */
export const extractSearchParam = (
    qp: string,
    qs = globalThis.location.search,
): string | null => {
    const params = new URLSearchParams(qs)
    const param = params.get(qp)
    return param
}

/**
 * Extracts a hash parameter from the given hash string.
 *
 * @param {string} hp - The hash parameter to extract.
 * @param {string} hs - The hash string.
 * @returns {string | null} The extracted parameter value.
 * @example
 * const hashString = '#/path?key1=value1&key2=value2';
 * const extractedParam = extractHashParam('key1', hashString);
 * // Result: 'value1' (example value, result will vary)
 */
export const extractHashParam = (
    hp: string,
    hs = globalThis.location.hash,
): string | null => {
    const withoutLeadingHash = hs.slice(1)
    return extractSearchParam(hp, `?${withoutLeadingHash}`)
}

/**
 * Replaces the search parameters in the browser history state.
 *
 * @param {Record<string, string | unknown>} params - The parameters to replace.
 * @param {History} history - The browser history object.
 * @param {Location} location - The browser location object.
 * @example
 * const paramsToReplace = { key1: 'value1', key2: 'value2' };
 * historyReplaceStateParams(paramsToReplace);
 */
export const historyReplaceStateParams = (
    params: Record<string, string | unknown>,
    history: History = globalThis.history,
    location: Location = globalThis.location,
) => {
    const search = setSearchParams(new URL(location.href), params).search
    history.replaceState(history.state, '', search)
}

/**
 * Gets a nested pathname based on the nesting level.
 *
 * @param {URL} url - The original URL.
 * @param {number} nestingLevel - The nesting level.
 * @returns {string} The nested pathname.
 * @example
 * const url = new URL('https://example.com/path1/path2/path3');
 * const nestedPath = getNestedPathname(url, 2);
 * // Result: '/path1/path2' (example value, result will vary)
 */
export const getNestedPathname = (url: URL, nestingLevel = 1): string => {
    if (nestingLevel < 1) return '/'
    return url.pathname
        .split('/')
        .slice(0, nestingLevel + 1)
        .join('/')
}
