from django.db import models


class MessageOwnerType(models.TextChoices):
    USER = ("user", "User")
    GPT = ("gpt", "GPT")


class Career(models.TextChoices):
    DEV = ("dev", "Software Engineer")
    DESIGNER = ("dsgnr", "Designer")
    PM = ("pm", "Project Manager")
    PO = ("po", "Product Owner")
    MK = ("mk", "Marketer")
    DS = ("ds", "Data Scientist")
    CW = ("cw", "Content Writer")


class SeniorityLevel(models.TextChoices):
    INTERN = (
        "int",
        "Intern",
    )
    JUNIOR = (
        "jun",
        "Junior",
    )
    MIDDLE = (
        "mid",
        "Middle",
    )
    SENIOR = (
        "snr",
        "Senior",
    )


class JobSearchStage(models.TextChoices):
    ACTIVE = ("act", "Active")
    OPEN = ("open", "Open to opportunities")
    STOPPED = ("stopped", "Not interested in any opportunities")
