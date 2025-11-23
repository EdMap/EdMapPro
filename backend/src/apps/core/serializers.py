from rest_framework import serializers
from src.apps.core.pagination import StandardResultsSetPagination
from src.apps.core.models import SeniorityLevel
from src.apps.core.models import Career


class ErrorDtoSerializer(serializers.Serializer):
    code = serializers.CharField(allow_null=True, required=False)
    message = serializers.CharField(allow_null=True, required=False)
    errors = serializers.ListField(
        child=serializers.DictField(), allow_null=True, required=False
    )

    def to_representation(self, instance):
        if instance.errors:
            self.fields["errors"] = ErrorDtoSerializer(many=True)
        return super().to_representation(instance)


class SessionRequest(serializers.Serializer):
    session_id = serializers.UUIDField()


class SendMessageRequest(SessionRequest):
    message = serializers.CharField()


class SessionResponse(serializers.Serializer):
    session_id = serializers.UUIDField()


class PaginationRequest(serializers.Serializer):
    limit = serializers.IntegerField(default=StandardResultsSetPagination.page_size)
    offset = serializers.IntegerField(default=0)


class PaginationResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True, required=False)
    previous = serializers.URLField(allow_null=True, required=False)
    results = serializers.ListField()


class SimulationSessionsSerializer(serializers.ModelSerializer):
    career = serializers.ChoiceField(choices=Career.choices)
    seniority_level = serializers.ChoiceField(choices=SeniorityLevel.choices)

    def __init__(self, *args, **kwargs):
        model = kwargs.pop("model", None)
        super().__init__(*args, **kwargs)
        if model:
            self.Meta.model = model

    class Meta:
        model = None
        fields = [
            "session_id",
            "creation_date",
            "session_status",
            "career",
            "seniority_level",
        ]
