export * from './__generated__/api'

export interface ErrorDto {
    code?: string | null
    message?: string | null
    errors?: ErrorDto[] | null
}
