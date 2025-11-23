from rest_framework.validators import UniqueValidator
from src.apps.core.models import Career, JobSearchStage, SeniorityLevel
from .models import UserProfile
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = (
            "date_joined",
            "email",
            "first_name",
            "get_full_name",
            "last_name",
            "username",
        )


class UserProfileSerializer(serializers.Serializer):
    class Meta:
        model = UserProfile

    user = UserSerializer(read_only=True)
    date_of_birth = serializers.DateField()
    career = serializers.ChoiceField(choices=Career.choices)
    seniority_level = serializers.ChoiceField(choices=SeniorityLevel.choices)
    gender = serializers.ChoiceField(choices=UserProfile.Gender.choices)
    job_search_stage = serializers.ChoiceField(choices=JobSearchStage.choices)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(
        required=True, validators=[UniqueValidator(queryset=User.objects.all())]
    )
    email = serializers.EmailField(
        required=True, validators=[UniqueValidator(queryset=User.objects.all())]
    )

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add custom response data here
        data["user"] = {
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "get_full_name": self.user.get_full_name(),
        }

        return data


class UserTokenDtoSerializer(serializers.Serializer):
    class Meta:
        model = UserProfile

    user = UserSerializer(read_only=True, allow_null=True)
    access = serializers.CharField(allow_null=True)
    refresh = serializers.CharField(allow_null=True)


class UserProfileUpdateDtoSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    career = serializers.ChoiceField(choices=Career.choices)
    seniority_level = serializers.ChoiceField(choices=SeniorityLevel.choices)
    gender = serializers.ChoiceField(choices=UserProfile.Gender.choices)


# TODO (hom): de-duplicate from core
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
