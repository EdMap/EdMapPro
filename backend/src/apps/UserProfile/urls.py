from .views import *
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
urlpatterns = router.urls


token_urls = [
    path("refresh/", RefreshTokenView.as_view(), name="refresh_token"),
]


urlpatterns += [
    path("login/", ObtainTokenView.as_view(), name="login"),
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("token/", include(token_urls)),
]
