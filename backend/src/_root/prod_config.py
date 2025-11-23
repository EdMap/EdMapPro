from pathlib import Path
import re
from decouple import config as env, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = env("DJANGO_APP_DEBUG", default=False, cast=bool)

SECRET_KEY = env("DJANGO_APP_SECRET_KEY", cast=str)

ALLOWED_HOSTS = env("DJANGO_APP_ALLOWED_HOSTS", cast=Csv())

ALLOWED_HOSTS.append(env("RENDER_EXTERNAL_HOSTNAME"))

CORS_ALLOWED_ORIGINS = env("DJANGO_APP_CORS_ORIGINS", default="", cast=Csv())

GROQ_API_KEY = env("DJANGO_APP_GROQ_API_KEY", default="", cast=str)

INTERVIEW_SIM_MODEL = env("DJANGO_APP_INTERVIEW_SIM_MODEL", default="", cast=str)
OFFER_SIM_MODEL = env("DJANGO_APP_OFFER_SIM_MODEL", default="", cast=str)

CORS_ALLOWED_ORIGIN_REGEXES = env(
    "DJANGO_APP_CORS_ORIGIN_REGEXES",
    default="",
    cast=lambda arr: [re.compile(env_var.strip()) for env_var in arr.split(", ")],
)


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": env("DJANGO_DATABASE_NAME", default="", cast=str),
        "USER": env("DJANGO_DATABASE_USER", default="", cast=str),
        "PASSWORD": env("DJANGO_DATABASE_PASSWORD", default="", cast=str),
        "HOST": env("DJANGO_DATABASE_HOST", default="", cast=str),
        "PORT": env("DJANGO_DATABASE_PORT", default="", cast=str),
    }
}
