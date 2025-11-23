from django.urls.conf import path
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()

urlpatterns = router.urls

urlpatterns += [
    path("add/", subscribe_to_email_listing, name="add_a_subscriber"),
]
