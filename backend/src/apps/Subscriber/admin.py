from django.contrib import admin
from django.http import HttpResponse
import csv
from .models import Subscriber


def export_as_csv(self, request, queryset):

    meta = self.model._meta
    field_names = [field.name for field in meta.fields]

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f"attachment; filename=emails_list.csv"
    writer = csv.writer(response)

    writer.writerow(field_names)
    for obj in queryset:

        row = writer.writerow([getattr(obj, field) for field in field_names])

    return response


def unsubscribe(self, request, queryset):
    queryset.update(is_subscribed=False)


def subscribe(self, request, queryset):
    queryset.update(is_subscribed=True)


export_as_csv.short_description = "Export Selected Emails"
unsubscribe.short_description = "Unsubscribe Selected Emails"
subscribe.short_description = "Subscribe Selected Emails"


class SubscriberAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "email_address",
        "name",
        "is_subscribed",
        "is_user",
        "user",
        "user_full_name",
        "creation_date",
        "update_date",
    )
    actions = [export_as_csv, unsubscribe, subscribe]
    list_filter = ("is_user", "is_subscribed")
    search_fields = ["email_address", "user__first_name", "user__email"]

    def user_full_name(self, obj):
        try:
            name = obj.user.get_full_name()
        except:
            name = "-"

        return name


admin.site.register(Subscriber, SubscriberAdmin)
