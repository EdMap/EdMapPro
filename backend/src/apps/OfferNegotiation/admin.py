from django.contrib import admin
from .models import OfferNegotiationSession, NegotiationSessionMessage


@admin.register(OfferNegotiationSession)
class OfferNegotiationSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "session_id",
        "session_status",
        "update_date",
        "creation_date",
    )


@admin.register(NegotiationSessionMessage)
class OfferNegotiationSessionMessageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "session",
        "update_date",
        "creation_date",
    )
