from .models import InterviewSession, InterviewSessionMessage
from rest_framework import serializers
from src.apps.core.serializers import (
    Career,
    PaginationResponseSerializer,
    SeniorityLevel,
    SimulationSessionsSerializer,
)


class InterviewMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSessionMessage
        fields = [
            "id",
            "text",
            "is_greeting",
            "message_owner_type",
            "question_reason",
        ]


class PaginatedInterviewSessionsSerializer(PaginationResponseSerializer):
    results = SimulationSessionsSerializer(many=True, model=InterviewSession)


class SessionSerializer(serializers.ModelSerializer):
    interview_messages = InterviewMessageSerializer(many=True, read_only=True)

    class Meta:
        model = InterviewSession
        fields = [
            "session_id",
            "creation_date",
            "session_status",
            "interview_messages",
            "feedback",
            "areas_for_improvement",
        ]


class SessionDtoSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSession
        fields = [
            "session_id",
            "session_status",
        ]


class InterviewMessageDtoSerializer(serializers.Serializer):
    session = SessionDtoSerializer(read_only=True)
    message = InterviewMessageSerializer(read_only=True)


class SessionFeedbackDtoSerializer(serializers.ModelSerializer):

    class Meta:
        model = InterviewSession
        fields = ["session_id", "feedback", "areas_for_improvement"]


class StartInterviewSessionRequest(serializers.Serializer):
    company = serializers.CharField(required=False)
    job_description = serializers.CharField(required=False)
    career = serializers.ChoiceField(choices=Career.choices, required=False)
    seniority_level = serializers.ChoiceField(
        choices=SeniorityLevel.choices, required=False
    )
