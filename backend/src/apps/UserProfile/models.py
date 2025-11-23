from django.contrib.auth import get_user_model
from django.db import models
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token
from src.apps.core.models import Career, SeniorityLevel, JobSearchStage


User = get_user_model()


class UserProfile(models.Model):
    """
    TODO (hom): Add method for calculating age relative to dob
    """

    class Meta:
        verbose_name_plural = "User Profiles"

    class Gender(models.TextChoices):
        MALE = ("male", "Male")
        FEMALE = ("female", "Female")
        OTHER = ("other", "Other")

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    update_date = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(auto_now=False, blank=True, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(choices=Gender.choices, blank=True, max_length=30)
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

    job_search_stage = models.CharField(
        default=JobSearchStage.ACTIVE,
        choices=JobSearchStage.choices,
        max_length=140,
        blank=True,
        null=True,
    )

    def __str__(self):
        return self.user.username

    def get_full_name(self):
        return self.user.get_full_name()

    def get_username(self):
        return self.user.get_username()


def post_create_user_profile(sender, instance, created, *args, **kwargs):
    if created:
        prof = UserProfile.objects.get_or_create(user=instance)
        prof[0].save()
        Token.objects.create(user=instance)


post_save.connect(
    post_create_user_profile,
    sender=User,
)
