from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.core.exceptions import ObjectDoesNotExist


User = get_user_model()


class Subscriber(models.Model):

    class Meta:
        verbose_name_plural = "Subscribed emails listing"

    email_address = models.EmailField(max_length=254, unique=True)
    name = models.CharField(max_length=120, default="", blank=True, null=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, default=None, blank=True, null=True
    )
    is_user = models.BooleanField(default=False, verbose_name="Is Registered User")
    is_subscribed = models.BooleanField(default=True, verbose_name="Is Subscribed")
    creation_date = models.DateTimeField(
        auto_now_add=True, verbose_name="Subscription Date"
    )
    update_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.id} {self.email_address}"


def post_create_subscriber(sender, instance, created, *args, **kwargs):
    if created:
        try:
            user = User.objects.get(email=instance.email_address)
        except ObjectDoesNotExist:
            user = False

        if user:
            instance.is_user = True
            instance.user = user
            instance.save()


post_save.connect(
    post_create_subscriber,
    sender=Subscriber,
)
