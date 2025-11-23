export interface AppConfig
    extends Pick<ImportMetaEnv, 'BASE_URL' | 'MODE' | 'DEV' | 'PROD'> {
    API_URL: string
}

const ENV_VAR_PREFIX = 'VITE_'
const mapViteEnvVars = (viteEnv: Record<string, string | boolean>) =>
    Object.keys(viteEnv).reduce((acc, curr) => {
        const newKey = (
            curr.startsWith(ENV_VAR_PREFIX)
                ? curr.slice(ENV_VAR_PREFIX.length)
                : curr
        ) as keyof AppConfig
        return { ...acc, [newKey]: viteEnv[curr] }
    }, {} as AppConfig)
export const config = mapViteEnvVars(import.meta.env)
