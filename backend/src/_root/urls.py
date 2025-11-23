from .config import DEBUG, IS_PROD, MEDIA_ROOT, MEDIA_URL, STATIC_ROOT, STATIC_URL
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularJSONAPIView,
    SpectacularSwaggerView,
)
from src.apps.views import get_csrf_token


"""
    NOTE (hom):
      Keeping the `api/csrf` and `api/subscribers` for legacy purposes
      will be removed as soon as the new landing page
      is implemented
"""
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1.0/", include("src.apps.urls")),
    path("api/csrf/", get_csrf_token, name="csrf"),
    path("api/subscribers/", include("src.apps.Subscriber.urls")),
]

if DEBUG and not IS_PROD:
    urlpatterns += [
        path(
            "swagger-types/",
            SpectacularJSONAPIView.as_view(),
            name="swagger-json",
        ),
        path(
            "swagger-ui/",
            SpectacularSwaggerView.as_view(url_name="swagger-json"),
            name="swagger-ui",
        ),
    ]


urlpatterns += static(STATIC_URL, document_root=STATIC_ROOT)
urlpatterns += static(MEDIA_URL, document_root=MEDIA_ROOT)
