from .models import Subscriber
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

MESSAGES = {
    "ALREADY_A_SUB": "ALREADY_A_SUB",
    "SUCCESS": "SUCCESS",
    "ERROR": "ERROR",
}


@api_view(("POST", "OPTIONS"))
@permission_classes([AllowAny])
def subscribe_to_email_listing(request):
    response = {
        "type": "error",
        "response": "Error",
    }

    try:
        sent_email = request.data["email"]
        sent_name = request.data["name"]
        try:
            is_subscribed = Subscriber.objects.get(email_address=sent_email)
            if is_subscribed:
                response = {"type": "ok", "response": f'{MESSAGES["ALREADY_A_SUB"]}'}

        except:
            try:
                sub = Subscriber()
                sub.email_address = sent_email
                sub.name = sent_name
                sub.save()
                response = {"type": "ok", "response": f'{MESSAGES["SUCCESS"]}'}

            except Exception as E:
                response = {
                    "type": "error",
                    "response": f'{MESSAGES["ERROR"]}',
                    "error": f"{str(E)}",
                }
                Response(response, status=status.HTTP_400_BAD_REQUEST)

    except Exception as E:
        response = {
            "type": "error",
            "response": f'{MESSAGES["ERROR"]}',
            "error": f"{str(E)} is not provided",
        }
        Response(response, status=status.HTTP_400_BAD_REQUEST)

    return Response(response, status=status.HTTP_200_OK)
