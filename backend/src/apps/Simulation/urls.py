from django.urls import path
from .views import *

urlpatterns = [
    path("greet_candidate", GreetCandidate.as_view(), name="greet_candidate"),
    path(
        "interview_session/",
        InterviewSessionView.as_view(),
        name="interview_session",
    ),
    path(
        "message_interview/", InterviewMessageView.as_view(), name="message_interview"
    ),
    path(
        "interview_session_feedback/",
        InterviewSessionFeedback.as_view(),
        name="interview_session_feedback",
    ),
    path(
        "sessions/",
        InterviewSessionsListView.as_view(),
        name="interview_sessions",
    ),
]
