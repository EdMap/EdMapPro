import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    SetSearchParamsOptions,
    appendSearchParams,
    extractHashParam,
    extractSearchParam,
    getNestedPathname,
    historyReplaceStateParams,
    setSearchParams,
} from './url'

describe('url', () => {
    describe('appendSearchParams()', () => {
        describe('when url has NO search yet', () => {
            it('should create search', () => {
                const url = new URL('https://example.com')
                const params = {
                    foo: 'bar',
                    boo: '42',
                    baz: 'false',
                }
                const actual = appendSearchParams(url, params).toString()
                const expected = 'https://example.com/?foo=bar&boo=42&baz=false'
                expect(actual).toEqual(expected)
            })
        })
        describe('when url already has a search', () => {
            it('should append search params to existing ones', () => {
                const url = new URL('https://example.com?foo=bar&baz=false')
                const params = {
                    boo: '42',
                }
                const actual = appendSearchParams(url, params).toString()
                const expected = 'https://example.com/?foo=bar&baz=false&boo=42'
                expect(actual).toEqual(expected)
            })
        })
        describe('when NO params given', () => {
            it('should return the given url as is', () => {
                const url = new URL('https://example.com?foo=bar&baz=false')
                const actual = appendSearchParams(url).toString()
                const expected = 'https://example.com/?foo=bar&baz=false'
                expect(actual).toEqual(expected)
            })

            it('should return the given url as is', () => {
                const url = new URL('https://example.com')
                const param = {}
                const actual = appendSearchParams(url, param).toString()
                const expected = 'https://example.com/'
                expect(actual).toEqual(expected)
            })

            it('should return the given url as is', () => {
                const url = new URL('https://example.com/')
                const param = undefined
                const actual = appendSearchParams(url, param).toString()
                const expected = url.toString()
                expect(actual).toEqual(expected)
            })

            it('should return the given url as is', () => {
                const url = new URL('https://example.com/?foo=bar')
                const param = null
                const actual = appendSearchParams(url, param).toString()
                const expected = url.toString()
                expect(actual).toEqual(expected)
            })
        })
    })

    describe('setSearchParams()', () => {
        describe('when url already has a search', () => {
            it('should append search params to existing ones', () => {
                const url = new URL('https://example.com?foo=bar&baz=false')
                const params = {
                    boo: '42',
                }
                const actual = setSearchParams(url, params).toString()
                const expected = 'https://example.com/?foo=bar&baz=false&boo=42'
                expect(actual).toEqual(expected)
            })

            it('should update existing ones', () => {
                const url = new URL('https://example.com?foo=bar&baz=false')
                const params = {
                    foo: 42,
                    baz: true,
                }
                const actual = setSearchParams(url, params).toString()
                const expected = 'https://example.com/?foo=42&baz=true'
                expect(actual).toEqual(expected)
            })
            it('should set nullish values as empty strings', () => {
                const url = new URL('https://example.com?foo=bar&baz=false')
                const params = {
                    bar: undefined,
                    baz: 0,
                    foo: null,
                }
                const actual = setSearchParams(url, params).toString()
                const expected = 'https://example.com/?foo=&baz=0&bar='
                expect(actual).toEqual(expected)
            })
        })
        describe('when NO params given', () => {
            it('should return the given url as is', () => {
                const url = new URL('https://example.com?foo=bar&baz=false')
                const actual = setSearchParams(url).toString()
                const expected = 'https://example.com/?foo=bar&baz=false'
                expect(actual).toEqual(expected)
            })

            it('should return the given url as is', () => {
                const url = new URL('https://example.com')
                const param = {}
                const actual = setSearchParams(url, param).toString()
                const expected = 'https://example.com/'
                expect(actual).toEqual(expected)
            })

            it('should return the given url as is', () => {
                const url = new URL('https://example.com/')
                const param = undefined
                const actual = setSearchParams(url, param).toString()
                const expected = url.toString()
                expect(actual).toEqual(expected)
            })

            it('should return the given url as is', () => {
                const url = new URL('https://example.com/?foo=bar')
                const param = null
                const actual = setSearchParams(url, param).toString()
                const expected = url.toString()
                expect(actual).toEqual(expected)
            })
        })

        describe('when using options', () => {
            const options: SetSearchParamsOptions = {
                clearSearch: true,
            }
            describe('when url already has a search', () => {
                it('should append search params to existing ones', () => {
                    const url = new URL('https://example.com?foo=bar&baz=false')
                    const params = {
                        boo: '42',
                    }
                    const actual = setSearchParams(
                        url,
                        params,
                        options,
                    ).toString()
                    const expected = 'https://example.com/?boo=42'
                    expect(actual).toEqual(expected)
                })

                it('should update existing ones', () => {
                    const url = new URL('https://example.com?foo=bar&baz=false')
                    const params = {
                        foo: 42,
                        baz: true,
                    }
                    const actual = setSearchParams(
                        url,
                        params,
                        options,
                    ).toString()
                    const expected = 'https://example.com/?foo=42&baz=true'
                    expect(actual).toEqual(expected)
                })
                it('should set nullish values as empty strings', () => {
                    const url = new URL('https://example.com?foo=bar&baz=false')
                    const params = {
                        bar: undefined,
                        baz: 0,
                        foo: null,
                    }
                    const actual = setSearchParams(
                        url,
                        params,
                        options,
                    ).toString()
                    const expected = 'https://example.com/?bar=&baz=0&foo='
                    expect(actual).toEqual(expected)
                })
            })
            describe('when NO params given', () => {
                it('should return url without search', () => {
                    const url = new URL('https://example.com?foo=bar&baz=false')
                    const actual = setSearchParams(
                        url,
                        null,
                        options,
                    ).toString()
                    const expected = 'https://example.com/'
                    expect(actual).toEqual(expected)
                })

                it('should return url without search', () => {
                    const url = new URL('https://example.com')
                    const param = {}
                    const actual = setSearchParams(
                        url,
                        param,
                        options,
                    ).toString()
                    const expected = 'https://example.com/'
                    expect(actual).toEqual(expected)
                })

                it('should return url without search', () => {
                    const url = new URL('https://example.com/')
                    const param = undefined
                    const actual = setSearchParams(
                        url,
                        param,
                        options,
                    ).toString()
                    const expected = url.toString()
                    expect(actual).toEqual(expected)
                })

                it('should return url without search', () => {
                    const url = new URL('https://example.com/?foo=bar')
                    const param = null
                    const actual = setSearchParams(
                        url,
                        param,
                        options,
                    ).toString()
                    const expected = 'https://example.com/'
                    expect(actual).toEqual(expected)
                })
            })
        })
    })

    describe('extractSearchParam()', () => {
        const url = new URL('https://example.com/?foo=bar&boo=faz&far=42')
        describe('when param is found', () => {
            it('should return the value', () => {
                const actual = extractSearchParam('boo', url.search)
                const expected = 'faz'
                expect(actual).toEqual(expected)
            })
        })
        describe('when param is NOT found', () => {
            it('should return null', () => {
                const actual = extractSearchParam('waldo_is_a_404', url.hash)
                const expected = null
                expect(actual).toEqual(expected)
            })
        })
    })

    describe('extractHashParam()', () => {
        const url = new URL('https://example.com/#foo=bar&boo=faz&far=42')
        describe('when param is found', () => {
            it('should return the value', () => {
                const actual = extractHashParam('boo', url.hash)
                const expected = 'faz'
                expect(actual).toEqual(expected)
            })
        })
        describe('when param is NOT found', () => {
            it('should return null', () => {
                const actual = extractHashParam('waldo_is_a_404', url.hash)
                const expected = null
                expect(actual).toEqual(expected)
            })
        })
    })

    describe('historyReplaceStateParams()', () => {
        const BASE_URL = 'https://example.com'
        const id = 420
        let historyMock: History

        beforeEach(() => {
            historyMock = {
                replaceState: vi.fn(),
                state: null,
            } as unknown as History
        })

        it('should add query param to url', () => {
            const locationMock = {
                href: `${BASE_URL}`,
            } as Location
            historyReplaceStateParams({ id }, historyMock, locationMock)
            expect(historyMock.replaceState).toHaveBeenCalledWith(
                null,
                '',
                `?id=${id}`,
            )
        })

        it('should replace query param to url', () => {
            const locationMock = {
                href: `${BASE_URL}?offset=foo&id=something-else&limit=69`,
            } as Location
            historyReplaceStateParams({ id }, historyMock, locationMock)
            expect(historyMock.replaceState).toHaveBeenCalledWith(
                null,
                '',
                `?offset=foo&id=${id}&limit=69`,
            )
        })
    })

    describe('getNestedPathname()', () => {
        const BASE_URL = 'https://example.com'
        const PART_1 = '/foo'
        const PART_2 = '/bar'
        const PART_3 = '/baz'
        const ROUTE = PART_1 + PART_2 + PART_3
        const FULL_URL = BASE_URL + ROUTE

        it('Should return first part of the route if nesting level not provided (defaults to 1)', () => {
            const url = new URL(FULL_URL)
            const actual = getNestedPathname(url)
            expect(actual).toBe(PART_1)
        })

        it('Should return "/" if nesting level is less than 1', () => {
            const url = new URL(FULL_URL)
            const actual1 = getNestedPathname(url, -1)
            const actual2 = getNestedPathname(url, 0)
            expect(actual1).toBe('/')
            expect(actual2).toBe('/')
        })

        it('Should always return "/" if base URL provided no matter nested value passed', () => {
            const url = new URL(BASE_URL)
            const actual1 = getNestedPathname(url, -1)
            const actual2 = getNestedPathname(url, 10)
            expect(actual1).toBe('/')
            expect(actual2).toBe('/')
        })

        it('Should return full pathname even if passed nestingLevel value exceeds the actual pathname nesting count', () => {
            const url = new URL(FULL_URL)
            const actual = getNestedPathname(url, 100)
            expect(actual).toBe(ROUTE)
        })

        it("Should return correct level of nested path according provided number if it doesn't exceed actual path", () => {
            const url = new URL(FULL_URL)
            const actual1 = getNestedPathname(url, 1)
            expect(actual1).toBe(PART_1)
            const actual2 = getNestedPathname(url, 2)
            expect(actual2).toBe(PART_1 + PART_2)
            const actual3 = getNestedPathname(url, 3)
            expect(actual3).toBe(ROUTE)
        })
    })
})
