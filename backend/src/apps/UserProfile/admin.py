from django.contrib import admin
from .models import User, UserProfile


class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "email",
        "get_full_name",
        "last_login",
        "date_joined",
        "is_staff",
    )


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "get_full_name",
        "last_active",
        "update_date",
        "creation_date",
    )
    list_filter = ("last_active", "update_date", "user__date_joined")


admin.site.register(UserProfile, UserProfileAdmin)
