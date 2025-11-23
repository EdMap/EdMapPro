from django.urls import path
from .views import *

urlpatterns = [
    path("greet_candidate", GreetCandidate.as_view(), name="greet_candidate"),
    path(
        "offer_negotiation_session/",
        OfferNegotiationSessionView.as_view(),
        name="negotiation_session",
    ),
    path("message_offer/", NegotiationMessageView.as_view(), name="message_offer"),
    path(
        "negotiation_session_feedback/",
        NegotiationFeedbackView.as_view(),
        name="negotiation_session_feedback",
    ),
    path(
        "sessions/",
        OfferNegotiationSessionsListView.as_view(),
        name="negotiation_sessions",
    ),
]
