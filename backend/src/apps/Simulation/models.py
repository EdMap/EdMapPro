from src.apps.core.models import Career, MessageOwnerType, SeniorityLevel
from django.db import models


class InterviewSession(models.Model):
    class Meta:
        verbose_name_plural = "_Interview Sessions"

    class SessionStatus(models.TextChoices):
        STARTED = ("started", "Started")
        DONE = ("done", "Done")

    session_id = models.CharField(max_length=256, unique=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)
    session_status = models.CharField(
        max_length=25, default=SessionStatus.STARTED, choices=SessionStatus.choices
    )
    user = models.ForeignKey(
        "UserProfile.UserProfile",
        related_name="interview_sessions",
        # NOTE (hom): This is a required field that can be set to null if the user profile is deleted
        null=True,
        on_delete=models.SET_NULL,
    )
    feedback = models.TextField(
        default="",
        blank=True,
    )
    areas_for_improvement = models.TextField(default="", blank=True)
    career = models.CharField(
        default=Career.DEV,
        choices=Career.choices,
        max_length=80,
        blank=True,
        null=True,
    )
    seniority_level = models.CharField(
        default=SeniorityLevel.JUNIOR,
        choices=SeniorityLevel.choices,
        max_length=20,
        blank=True,
        null=True,
    )
    company = models.CharField(
        default="edmap.io", max_length=144, blank=True, null=True
    )
    job_description = models.TextField(default="", blank=True, null=True)

    def __str__(self):
        # TODO (hom): later replace with the possible name or interview lvl
        user = self.user.user.username if self.user != None else None
        return f"{user}'s session: {self.session_id}"

    def get_session_history(self):
        messages = self.interview_messages.all().order_by("creation_date")
        history = ""
        first_name = self.user.user.first_name if self.user != None else None

        for message in messages:
            history += f"""{"Recruiter's" if message.message_owner_type == MessageOwnerType.GPT else f"{first_name}'s"} message:\n"{message.text}"\n\n"""

        return history

    def get_session_interview_history(self):
        messages = self.interview_messages.all().order_by("creation_date")
        return messages

    def has_greeting_message(self):
        message = self.interview_messages.filter(is_greeting=True)
        if message.first() != None:
            return message.first()
        return False

    def get_last_question(self):
        message = (
            self.interview_messages.filter(message_owner_type=MessageOwnerType.GPT)
            .order_by("-creation_date")
            .first()
        )

        return message

    def get_last_answer(self):
        message = (
            self.interview_messages.filter(message_owner_type=MessageOwnerType.USER)
            .order_by("-creation_date")
            .first()
        )

        return message


class InterviewSessionMessage(models.Model):
    class Meta:
        verbose_name_plural = "_Interview Messages"

    session = models.ForeignKey(
        InterviewSession, related_name="interview_messages", on_delete=models.CASCADE
    )
    message_owner_type = models.CharField(
        max_length=8, choices=MessageOwnerType.choices
    )
    text = models.TextField()
    creation_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        "UserProfile.UserProfile", blank=True, null=True, on_delete=models.SET_NULL
    )
    question_reason = models.TextField(
        default="",
        blank=True,
    )
    is_greeting = models.BooleanField(
        default=False,
    )

    def __str__(self):
        user_display = self.user if self.user else MessageOwnerType.GPT
        return f"{user_display}'s message at: {self.creation_date}"
