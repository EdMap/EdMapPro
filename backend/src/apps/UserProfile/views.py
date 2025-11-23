from django.contrib.auth import get_user_model
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
)
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import UserProfile
from .serializers import (
    ErrorDtoSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserProfileUpdateDtoSerializer,
    UserRegistrationSerializer,
    UserTokenDtoSerializer,
)


User = get_user_model()


RefreshTokenView = extend_schema(
    operation_id="refresh",
    request=TokenRefreshSerializer,
    responses={
        status.HTTP_200_OK: OpenApiResponse(TokenRefreshSerializer),
        status.HTTP_401_UNAUTHORIZED: OpenApiResponse(
            ErrorDtoSerializer,
        ),
    },
)(TokenRefreshView)


class ObtainTokenView(TokenObtainPairView):
    serializer_class = UserLoginSerializer

    @extend_schema(
        operation_id="login",
        description="Login and obtain jwt tokens and user info",
        request=UserLoginSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(UserTokenDtoSerializer),
            status.HTTP_401_UNAUTHORIZED: OpenApiResponse(
                ErrorDtoSerializer,
            ),
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="register",
        description="Register a new user and receive JWT tokens",
        request=UserRegistrationSerializer,
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(UserTokenDtoSerializer),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                ErrorDtoSerializer,
            ),
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            response_data = {
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "get_full_name": user.get_full_name(),
                    "is_initialized": False,
                },
                "refresh": str(refresh),
                "access": str(access),
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="profile",
        responses={
            status.HTTP_200_OK: OpenApiResponse(UserProfileSerializer),
        },
    )
    def get(self, request, *args, **kwargs):
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @extend_schema(
        operation_id="profile-update",
        request=UserProfileUpdateDtoSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(UserProfileSerializer),
        },
    )
    def put(self, request, *args, **kwargs):
        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=404)

        try:
            data = request.data
            user = User.objects.get(pk=request.user.id)
            user.first_name = data.get("first_name")
            user.last_name = data.get("last_name")
            profile.seniority_level = data.get("seniority_level")
            profile.career = data.get("career")
            profile.gender = data.get("gender")

            # TODO (hom): Add profile update fields
            user.save()
            profile.save()
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)

        except Exception as E:
            return Response(
                {"error": f"{E}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# NOTE (hom): Old api, should be deleted
"""
RESPONSE_TYPES = {"OK": "ok", "ERROR": "error"}

MESSAGES = {
    "EMAIL_MISMATCH": "Email or password mismatch",
    "PASSWORD_TOO_SHORT": "Password length is less than 6",
    "VALIDATION_ERROR": "Validation Error",
    "SERVER_ERROR": "Server error",
}


@api_view(("POST", "OPTIONS"))
@permission_classes([AllowAny])
def user_login(request):
    response = {"type": RESPONSE_TYPES["ERROR"], "response": "Error"}
    try:
        usr = authenticate(
            username=request.data.get("username"), password=request.data.get("password")
        )
        login(request, usr)

    except Exception as e:
        response["response"] = MESSAGES["EMAIL_MISMATCH"]
        response["error"] = f"{e}"
        print(e)
        return Response(response, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_profile = UserProfile.objects.get(user=usr)

        user_id = user_profile.id
        token = Token.objects.get(user=usr)

    except Exception as E:
        logout(request)
        response["response"] = f"try again {E}"
        return Response(response, status=status.HTTP_404_NOT_FOUND)

    response = {
        "type": RESPONSE_TYPES["OK"],
        "token": token.key,
        "response": "Success",
        # TODO (hom): remove and use tokens only
        "user": {
            "user_id": usr.id,
            "user_profile_id": user_id,
            "username": usr.get_username(),
            "full_name": user_profile.get_full_name(),
        },
    }

    return Response(response, status=status.HTTP_200_OK)


@api_view(("POST", "OPTIONS"))
@permission_classes([AllowAny])
def user_register(request):
    response = {"type": "error", "response": "Error"}
    try:
        username = request.data["username"]
        email = request.data["email"]
        pswd = request.data["password"]
        usr = profile = None
        token = None

        if len(pswd) < 6:
            raise ValidationError(MESSAGES["PASSWORD_TOO_SHORT"])

        try:
            usr = User.objects.create_user(username, email, pswd)
            usr.clean_fields()
            usr.save()

            try:
                user_profile = UserProfile.objects.get(user=usr)
                user_id = user_profile.id
            except ObjectDoesNotExist as e:
                response["error"] = f"{e}"
                return Response(response, status=status.HTTP_404_NOT_FOUND)

            try:
                auth = authenticate(username=email, password=pswd)
                login(request, auth)
                token = Token.objects.get(user=usr)
            except AuthenticationError as e:
                response["error"] = f"{e}"
                return Response(response, status=status.HTTP_401_UNAUTHORIZED)

            response = {
                "type": RESPONSE_TYPES["OK"],
                "token": token.key,
                "response": "Success",
                # TODO (hom): remove and use tokens only
                "user": {
                    "user_id": usr.id,
                    "user_profile_id": user_id,
                    "username": usr.get_username(),
                    "full_name": user_profile.get_full_name(),
                },
            }

            return Response(response, status=status.HTTP_201_CREATED)

        except Exception as e:
            response["response"] = MESSAGES["SERVER_ERROR"]
            response["error"] = f"{e}"
            return Response(response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except ValidationError as e:
        response["response"] = MESSAGES["VALIDATION_ERROR"]
        response["error"] = e
        return Response(response, status=status.HTTP_400_BAD_REQUEST)

"""
