from .models import NegotiationSessionMessage, OfferNegotiationSession
from .serializers import (
    NegotiationMessageDtoSerializer,
    NegotiationSessionResponseSerializer,
    NegotiationSessionSerializer,
    NegotiationSessionFeedbackDtoSerializer,
)
from .serializers import PaginatedOfferNegotiationSessionsSerializer
from datetime import datetime, timedelta
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.views import APIView
from src.agents.offer.greeting_agent import GreetingAgent
from src.agents.offer.negotiation_agent import NegotiationAgent
from src.agents.offer.negotiation_feedback_agent import NegotiationFeedbackAgent
from src.agents.offer.offer_generation_agent import OfferAgent
from src.apps.core.models import MessageOwnerType
from src.apps.core.serializers import (
    ErrorDtoSerializer,
    PaginationRequest,
    SendMessageRequest,
    SessionRequest,
    SimulationSessionsSerializer,
)
from src.apps.UserProfile.models import UserProfile
import uuid


class OfferNegotiationSessionsListView(APIView, LimitOffsetPagination):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="get_negotiation_sessions",
        request=PaginationRequest,
        parameters=[PaginationRequest],
        responses={"200": PaginatedOfferNegotiationSessionsSerializer},
    )
    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)
        queryset = OfferNegotiationSession.objects.filter(user=profile).order_by(
            "-creation_date"
        )
        page = self.paginate_queryset(queryset, request)

        if page is not None:
            serializer = SimulationSessionsSerializer(
                page, many=True, model=OfferNegotiationSession
            )
            return self.get_paginated_response(serializer.data)

        serializer = SimulationSessionsSerializer(
            queryset, many=True, model=OfferNegotiationSession
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class GreetCandidate(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="greet_negotiation_candidate",
        request=SessionRequest,
        responses={
            "200": NegotiationMessageDtoSerializer,
            "500": ErrorDtoSerializer,
        },
    )
    def post(self, request):
        user = request.user
        session_id = request.data["session_id"]

        try:
            profile = UserProfile.objects.get(user=user)
        except Exception as e:
            return Response({"error": f"{e}"}, status=status.HTTP_400_BAD_REQUEST)

        negotiation_session = OfferNegotiationSession.objects.get(session_id=session_id)
        greeting = negotiation_session.has_greeting_message()

        if not greeting:
            name = (
                profile.user.first_name
                if profile.user.first_name != ""
                else profile.get_username()
            )
            try:
                history = ""
                seniority = (
                    negotiation_session.get_seniority_level_display()
                    if negotiation_session.seniority_level != None
                    else profile.get_seniority_level_display()
                )
                career = (
                    negotiation_session.get_career_display()
                    if negotiation_session.career != None
                    else profile.get_career_display()
                )
                agent = GreetingAgent(
                    {
                        "recruiter_name": "Jane",
                        "company_name": "edmap.io",
                        "position": f"{seniority} {career}",
                        "history": f"{history}",
                        "candidate_name": name,
                    }
                )

                llm_response = agent.response()

                # NOTE(hom): does it make sense to keep entire session history in session as raw text?
                message = NegotiationSessionMessage.objects.create(
                    session_id=negotiation_session.id,
                    message_owner_type=MessageOwnerType.GPT,
                    text=llm_response["response"],
                    is_greeting=True,
                )

                if llm_response["is_terminated"] == True:
                    negotiation_session.session_status = (
                        OfferNegotiationSession.SessionStatus.DONE
                    )
                    negotiation_session.save()

                response = {
                    "session": {
                        "session_id": negotiation_session.session_id,
                        "session_status": negotiation_session.session_status,
                    },
                    "message": {
                        "id": message.pk,
                        "text": message.text,
                        "is_greeting": message.is_greeting,
                        "message_owner_type": message.message_owner_type,
                    },
                }

            except Exception as e:
                return Response(
                    {"error": f"{e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        else:
            response = {
                "session": {
                    "session_id": negotiation_session.session_id,
                    "session_status": negotiation_session.session_status,
                },
                "message": {
                    "id": greeting.pk,
                    "text": greeting.text,
                    "is_greeting": greeting.is_greeting,
                    "message_owner_type": greeting.message_owner_type,
                },
            }
        return Response(response, status=status.HTTP_200_OK)


class OfferNegotiationSessionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="get_negotiation_session_history",
        parameters=[SessionRequest],
        request=SessionRequest,
        responses=NegotiationSessionSerializer,
    )
    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)

        session = get_object_or_404(
            OfferNegotiationSession,
            session_id=request.GET.get("session_id"),
            user=profile,
        )
        serializer = NegotiationSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="start_negotiation_session",
        responses=NegotiationSessionResponseSerializer,
    )
    def post(self, request, format=None):
        user = request.user
        session_id = str(uuid.uuid4())

        try:
            profile = UserProfile.objects.get(user=user)
        except Exception as e:
            return Response({"error": f"{e}"}, status=status.HTTP_400_BAD_REQUEST)

        negotiation_session = OfferNegotiationSession.objects.create(
            session_id=session_id,
            user=profile,
            initial_offer="",
            career=profile.career,
            seniority_level=profile.seniority_level,
        )

        name = (
            profile.user.first_name
            if profile.user.first_name != ""
            else profile.get_username()
        )

        offer_due_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        start_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        history = negotiation_session.get_session_history()

        seniority = (
            negotiation_session.get_seniority_level_display()
            if negotiation_session.seniority_level != None
            else profile.get_seniority_level_display()
        )
        career = (
            negotiation_session.get_career_display()
            if negotiation_session.career != None
            else profile.get_career_display()
        )

        # TODO need to update the displays on all changed places for seniority and career
        agent = OfferAgent(
            {
                "recruiter_name": "Jane",
                "company_name": "edmap.io",
                "position": f"{seniority} {career}",
                "candidate_name": name,
                "offer_due_date": offer_due_date,
                "start_date": start_date,
                "history": history,
                "initial_offer": None,
            }
        )

        llm_response = agent.response()

        negotiation_session.initial_offer = llm_response["response"]
        negotiation_session.save()

        return Response(
            {
                "session_id": negotiation_session.session_id,
                "initial_offer": negotiation_session.initial_offer,
                "session_status": negotiation_session.session_status,
            },
            status=status.HTTP_201_CREATED,
            content_type="application/json",
        )


class NegotiationMessageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="send_negotiation_message",
        request=SendMessageRequest,
        responses={
            "200": NegotiationMessageDtoSerializer,
            "500": ErrorDtoSerializer,
        },
    )
    def post(self, request, format=None):

        try:
            profile = UserProfile.objects.get(user=request.user)
            message = request.data["message"].strip()
            session = OfferNegotiationSession.objects.get(
                session_id=request.data["session_id"]
            )
            NegotiationSessionMessage.objects.create(
                message_owner_type=MessageOwnerType.USER,
                session_id=session.id,
                text=message,
                user=profile,
            )

            history = session.get_session_history()
            name = (
                profile.user.first_name
                if profile.user.first_name != ""
                else profile.get_username()
            )

            seniority = (
                session.get_seniority_level_display()
                if session.seniority_level != None
                else profile.get_seniority_level_display()
            )
            career = (
                session.get_career_display()
                if session.career != None
                else profile.get_career_display()
            )

            agent = NegotiationAgent(
                {
                    "recruiter_name": "Jane",
                    "company_name": "edmap.io",
                    "position": f"{seniority} {career}",
                    "history": history,
                    "candidate_name": name,
                    "job_description": "not found",
                    "current_answer": f"{message}",
                    "current_question": session.get_last_question(),
                    "job_offer": session.initial_offer,
                }
            )

            llm_response = agent.generate_response()

            message = NegotiationSessionMessage.objects.create(
                message_owner_type=MessageOwnerType.GPT,
                session_id=session.id,
                text=llm_response["response"],
            )

            if llm_response["is_terminated"] == True:
                session.session_status = OfferNegotiationSession.SessionStatus.DONE
                session.save()

            response = {
                "session": {
                    "session_id": session.session_id,
                    "session_status": session.session_status,
                },
                "message": {
                    "id": message.pk,
                    "text": message.text,
                    "is_greeting": message.is_greeting,
                    "message_owner_type": message.message_owner_type,
                },
            }

            return Response(response, status=status.HTTP_200_OK)

        except Exception as e:
            print(e, "hello")
            return Response(
                {"error": f"{e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class NegotiationFeedbackView(APIView):
    @extend_schema(
        operation_id="get_negotiation_session_feedback",
        parameters=[SessionRequest],
        request=SessionRequest,
        responses={
            200: NegotiationSessionFeedbackDtoSerializer,
            500: ErrorDtoSerializer,
        },
    )
    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)

        session = get_object_or_404(
            OfferNegotiationSession,
            session_id=request.GET.get("session_id"),
            user=profile,
        )

        try:
            serializer = NegotiationSessionFeedbackDtoSerializer(session)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"{e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        operation_id="generate_offer_negotiation_feedback",
        parameters=[SessionRequest],
        responses={400: ErrorDtoSerializer, 500: ErrorDtoSerializer},
    )
    def put(self, request):

        profile = UserProfile.objects.get(user=request.user)

        session = get_object_or_404(
            OfferNegotiationSession,
            session_id=request.GET.get("session_id"),
            user=profile,
        )

        if session.feedback != "" and session.feedback != None:
            return Response(status=status.HTTP_204_NO_CONTENT)

        name = (
            profile.user.first_name
            if profile.user.first_name != ""
            else profile.get_username()
        )
        try:
            history = session.get_session_history()
            agent = NegotiationFeedbackAgent(
                {
                    "recruiter_name": "Jane",
                    "company_name": "edmap.io",
                    # TODO (hom): needs to be changed to the applied job posting settings
                    "history": f"{history}",
                    "candidate_name": name,
                }
            )

            llm_response = agent.response()
            session.feedback = llm_response["feedback"]
            session.areas_for_improvement = llm_response["areas_for_improvement"]

            offer_due_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
            start_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
            history = session.get_session_history()
            seniority = (
                session.get_seniority_level_display()
                if session.seniority_level != None
                else profile.get_seniority_level_display()
            )
            career = (
                session.get_career_display()
                if session.career != None
                else profile.get_career_display()
            )
            offer_agent = OfferAgent(
                {
                    "recruiter_name": "Jane",
                    "company_name": "edmap.io",
                    "position": f"{seniority} {career}",
                    "candidate_name": name,
                    "offer_due_date": offer_due_date,
                    "start_date": start_date,
                    "history": history,
                    "initial_offer": session.initial_offer,
                }
            )
            session.offer = offer_agent.response()["response"]

            session.save()

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response(
                {"error": f"{e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
