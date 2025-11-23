from django.urls import path, include
from .views import *


urlpatterns = [
    path(
        "accounts/",
        include("src.apps.UserProfile.urls"),
    ),
    path(
        "interview_simulation/",
        include("src.apps.Simulation.urls"),
    ),
    path("offer_negotiation_simulation/", include("src.apps.OfferNegotiation.urls")),
]
