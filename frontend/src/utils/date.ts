const DEFAULT_FORMAT_OPTIONS = {
    dateStyle: 'medium',
    timeStyle: 'short',
} as const

export function formatDate(
    date?: Date | string | null,
    locale?: string | string[],
    options: Intl.DateTimeFormatOptions = DEFAULT_FORMAT_OPTIONS,
) {
    const d = new Date(date + '')
    const isInvalid = d.toString() === 'Invalid Date'

    return isInvalid
        ? null
        : new Intl.DateTimeFormat(locale, options).format(d).replaceAll(',', '')
}

export const formatISODateString = (date?: string | null): string => {
    return date ? date.split('T')[0] : ''
}
