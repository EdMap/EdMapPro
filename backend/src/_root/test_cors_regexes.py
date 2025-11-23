import re
from django.test import TestCase
from django.conf import settings


class CorsRegexTestCase(TestCase):
    def test_cors_allowed_origins(self):
        if settings.IS_PROD:
            for regex_pattern in settings.CORS_ALLOWED_ORIGIN_REGEXES:
                compiled_regex = re.compile(regex_pattern)
                matching_origin = "https://bloooo.edmap-landing.pages.dev/"

                self.assertTrue(
                    compiled_regex.match(matching_origin),
                    msg=f"Regex {regex_pattern} doesn't match {matching_origin}",
                )
