from rest_framework.pagination import LimitOffsetPagination
from src.agents.interview.feedback_agent import FeedbackAgent
from src.agents.interview.greeting_agent import GreetingAgent
from src.agents.interview.interviewer_agent import HRAgent
from .models import InterviewSession, InterviewSessionMessage
from .serializers import (
    InterviewMessageDtoSerializer,
    SessionFeedbackDtoSerializer,
    SessionSerializer,
    PaginatedInterviewSessionsSerializer,
    StartInterviewSessionRequest,
)
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from src.apps.core.models import MessageOwnerType
from src.apps.core.serializers import (
    ErrorDtoSerializer,
    SessionRequest,
    SendMessageRequest,
    SessionResponse,
    PaginationRequest,
    SimulationSessionsSerializer,
)
from src.apps.core.utils import chunk_text
from src.apps.UserProfile.models import UserProfile
import time
from datetime import datetime, timezone
import uuid


DEFAULT_INTERVIEW_TIME_LIMIT = 15 * 60


def generate_response_stream(prompt):
    try:
        response_parts = list(chunk_text(prompt))
        for part in response_parts:
            yield f"data: {part} \n\n"
            time.sleep(0.1)
        yield "data: [DONE]\n\n"

    except:
        yield "data: [Error fetching response]\n\n"


class InterviewSessionsListView(APIView, LimitOffsetPagination):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="get_interview_sessions",
        request=PaginationRequest,
        parameters=[PaginationRequest],
        responses={"200": PaginatedInterviewSessionsSerializer},
    )
    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)
        queryset = InterviewSession.objects.filter(user=profile).order_by(
            "-creation_date"
        )
        page = self.paginate_queryset(queryset, request)

        if page is not None:
            serializer = SimulationSessionsSerializer(
                page, many=True, model=InterviewSession
            )
            return self.get_paginated_response(serializer.data)

        serializer = SimulationSessionsSerializer(
            queryset, many=True, model=InterviewSession
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class InterviewSessionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="get_session_history",
        parameters=[SessionRequest],
        request=SessionRequest,
        responses=SessionSerializer,
    )
    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)

        session = get_object_or_404(
            InterviewSession,
            session_id=request.GET.get("session_id"),
            user=profile,
        )
        serializer = SessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        operation_id="start_session",
        responses=SessionResponse,
        request=StartInterviewSessionRequest,
    )
    def post(self, request, format=None):
        user = request.user
        session_id = str(uuid.uuid4())
        configuration = request.data

        try:
            profile = UserProfile.objects.get(user=user)
        except Exception as e:
            return Response({"error": f"{e}"}, status=status.HTTP_400_BAD_REQUEST)

        interview_session = InterviewSession.objects.create(
            session_id=session_id,
            user=profile,
            career=configuration["career"] or profile.career,
            seniority_level=configuration["seniority_level"] or profile.seniority_level,
            company=configuration["company"] or "edmap.io",
            job_description=configuration["job_description"] or "not found",
        )

        return Response(
            {
                "session_id": interview_session.session_id,
            },
            status=status.HTTP_201_CREATED,
            content_type="application/json",
        )


class InterviewMessageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="send_message",
        request=SendMessageRequest,
        responses={
            "200": InterviewMessageDtoSerializer,
            "500": ErrorDtoSerializer,
        },
    )
    def post(self, request, format=None):

        try:
            profile = UserProfile.objects.get(user=request.user)
            message = request.data["message"].strip()
            session = InterviewSession.objects.get(
                session_id=request.data["session_id"]
            )
            InterviewSessionMessage.objects.create(
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

            agent = HRAgent(
                {
                    "recruiter_name": "Jane",
                    "company_name": session.company,
                    # TODO (hom): needs to be changed to the applied job posting settings
                    "position": f"{seniority} {career}",
                    "history": f"{history}",
                    "candidate_name": name,
                    "questions": "How do you plan your day?",
                    "job_description": session.job_description,
                    "current_answer": f"{message}",
                    "current_question": session.get_last_question(),
                    "start_time": session.creation_date,
                    "time_limit": DEFAULT_INTERVIEW_TIME_LIMIT,
                    "elapsed": (
                        datetime.now(timezone.utc) - session.creation_date
                    ).seconds,
                }
            )

            llm_response = agent.generate_response()

            message = InterviewSessionMessage.objects.create(
                message_owner_type=MessageOwnerType.GPT,
                session_id=session.id,
                text=llm_response["response"],
                question_reason=llm_response["question_reason"],
            )

            if llm_response["is_terminated"] == True:
                session.session_status = InterviewSession.SessionStatus.DONE
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
                    "question_reason": message.question_reason,
                },
            }

            return Response(response, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"{e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GreetCandidate(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="greet_candidate",
        request=SessionRequest,
        responses={
            "200": InterviewMessageDtoSerializer,
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

        interview_session = InterviewSession.objects.get(session_id=session_id)
        greeting = interview_session.has_greeting_message()

        if not greeting:
            name = (
                profile.user.first_name
                if profile.user.first_name != ""
                else profile.get_username()
            )
            try:
                history = ""
                seniority = (
                    interview_session.get_seniority_level_display()
                    if interview_session.seniority_level != None
                    else profile.get_seniority_level_display()
                )
                career = (
                    interview_session.get_career_display()
                    if interview_session.career != None
                    else profile.get_career_display()
                )

                agent = GreetingAgent(
                    {
                        "recruiter_name": "Jane",
                        "company_name": interview_session.company,
                        "position": f"{seniority} {career}",
                        "history": f"{history}",
                        "candidate_name": name,
                        "questions": "How do you plan your day?",
                        "job_description": interview_session.job_description,
                        "current_answer": "",
                        "current_question": "",
                    }
                )

                llm_response = agent.response()

                # NOTE(hom): does it make sense to keep entire session history in session as raw text?
                message = InterviewSessionMessage.objects.create(
                    session_id=interview_session.id,
                    message_owner_type=MessageOwnerType.GPT,
                    text=llm_response["response"],
                    question_reason=llm_response["question_reason"],
                    is_greeting=True,
                )

                if llm_response["is_terminated"] == True:
                    interview_session.session_status = (
                        InterviewSession.SessionStatus.DONE
                    )
                    interview_session.save()

                response = {
                    "session": {
                        "session_id": interview_session.session_id,
                        "session_status": interview_session.session_status,
                    },
                    "message": {
                        "id": message.pk,
                        "text": message.text,
                        "is_greeting": message.is_greeting,
                        "message_owner_type": message.message_owner_type,
                        "question_reason": message.question_reason,
                    },
                }

            except Exception as e:
                return Response(
                    {"error": f"{e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        else:
            response = {
                "session": {
                    "session_id": interview_session.session_id,
                    "session_status": interview_session.session_status,
                },
                "message": {
                    "id": greeting.pk,
                    "text": greeting.text,
                    "is_greeting": greeting.is_greeting,
                    "message_owner_type": greeting.message_owner_type,
                    "question_reason": message.question_reason,
                },
            }
        return Response(response, status=status.HTTP_200_OK)


class InterviewSessionFeedback(APIView):

    @extend_schema(
        operation_id="get_session_feedback",
        parameters=[SessionRequest],
        request=SessionRequest,
        responses={200: SessionFeedbackDtoSerializer, 500: ErrorDtoSerializer},
    )
    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)

        session = get_object_or_404(
            InterviewSession,
            session_id=request.GET.get("session_id"),
            user=profile,
        )

        try:
            serializer = SessionFeedbackDtoSerializer(session)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"{e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        operation_id="generate_session_feedback",
        parameters=[SessionRequest],
        responses={400: ErrorDtoSerializer, 500: ErrorDtoSerializer},
    )
    def put(self, request):

        profile = UserProfile.objects.get(user=request.user)

        session = get_object_or_404(
            InterviewSession,
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
            agent = FeedbackAgent(
                {
                    "recruiter_name": "Jane",
                    "company_name": "edmap.io",
                    # TODO (hom): needs to be changed to the applied job posting settings
                    "position": f"{seniority} {career}",
                    "history": f"{history}",
                    "candidate_name": name,
                    "questions": "",
                    "job_description": "not found",
                    "current_answer": session.get_last_answer(),
                    "current_question": session.get_last_question(),
                }
            )

            llm_response = agent.response()
            session.feedback = llm_response["feedback"]
            session.areas_for_improvement = llm_response["areas_for_improvement"]

            session.save()

            return Response(status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response(
                {"error": f"{e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
