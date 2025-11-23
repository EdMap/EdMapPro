from .models import *
from django.contrib import admin
from django.db.models import Count


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "session_id",
        "session_status",
        "update_date",
        "creation_date",
    )


@admin.register(InterviewSessionMessage)
class InterviewSessionMessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "session",
        "update_date",
        "creation_date",
    )
