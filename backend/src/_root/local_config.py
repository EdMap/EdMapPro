from decouple import config as env, Csv
from pathlib import Path
import re

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = env("DJANGO_APP_DEBUG", default=True, cast=bool)

SECRET_KEY = env("DJANGO_APP_SECRET_KEY", default="insecure-secret-key", cast=str)

ALLOWED_HOSTS = env("DJANGO_APP_ALLOWED_HOSTS", default="", cast=Csv())

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
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
