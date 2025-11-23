from .model_config import generate_offer_llm_response
from src._prompts.offer_negotiation.offer_generation import *


class OfferAgent:
    def __init__(self, inputs):
        self.candidate_name = inputs["candidate_name"]
        self.company_name = inputs["company_name"]
        self.offer_due_date = inputs["offer_due_date"]
        self.position = inputs["position"]
        self.recruiter_name = inputs["recruiter_name"]
        self.start_date = inputs["start_date"]
        self.history = inputs["history"]
        self.initial_offer = inputs["initial_offer"]

    def response(self):
        PROMPT = INITIAL_OFFER_PROMPT
        if not self.initial_offer == None:
            PROMPT = OFFER_PROMPT

        offer = generate_offer_llm_response(
            PROMPT.format(
                candidate_name=self.candidate_name,
                company_name=self.company_name,
                position=self.position,
                recruiter_name=self.recruiter_name,
                offer_due_date=self.offer_due_date,
                start_date=self.start_date,
                history=self.history,
                initial_offer=(
                    self.initial_offer if not self.initial_offer == None else ""
                ),
            )
        )

        return {
            "response": offer.content,
        }
