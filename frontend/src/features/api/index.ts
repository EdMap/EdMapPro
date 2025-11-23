import { Api as ApiBase } from '../../__generated__/api'

const API_URL = import.meta.env.VITE_API_URL

function Api(token?: string | null) {
    const AUTH_TOKEN = token ?? globalThis.localStorage.getItem('ACCESS') ?? ''

    const headers =
        AUTH_TOKEN && AUTH_TOKEN !== ''
            ? {
                  Authorization: `Bearer ${AUTH_TOKEN ?? ''}`,
              }
            : { Authorization: '' }

    return new ApiBase({
        baseUrl: API_URL,
        baseApiParams: {
            headers,
        },
    })
}

export default Api
