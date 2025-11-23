from .models import OfferNegotiationSession, NegotiationSessionMessage
from rest_framework import serializers
from src.apps.core.models import Career, SeniorityLevel
from src.apps.core.serializers import (
    PaginationResponseSerializer,
    SimulationSessionsSerializer,
)


class NegotiationMessageSerializer(serializers.ModelSerializer):

    class Meta:
        model = NegotiationSessionMessage
        fields = [
            "id",
            "text",
            "is_greeting",
            "message_owner_type",
        ]


class PaginatedOfferNegotiationSessionsSerializer(PaginationResponseSerializer):
    results = SimulationSessionsSerializer(many=True, model=OfferNegotiationSession)


class NegotiationSessionSerializer(serializers.ModelSerializer):
    negotiation_messages = NegotiationMessageSerializer(many=True, read_only=True)

    class Meta:
        model = OfferNegotiationSession
        fields = [
            "session_id",
            "creation_date",
            "session_status",
            "negotiation_messages",
            "initial_offer",
            "offer",
        ]


class NegotiationSessionResponseSerializer(serializers.ModelSerializer):

    class Meta:
        model = OfferNegotiationSession
        fields = ["session_id", "initial_offer", "session_status"]


class NegotiationMessageDtoSerializer(serializers.Serializer):
    session = NegotiationSessionResponseSerializer(read_only=True)
    message = NegotiationMessageSerializer(read_only=True)


class NegotiationSessionFeedbackDtoSerializer(serializers.ModelSerializer):

    class Meta:
        model = OfferNegotiationSession
        fields = ["session_id", "feedback", "areas_for_improvement", "offer"]
