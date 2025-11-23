from .model_config import generate_offer_llm_response
from src._prompts.offer_negotiation.finish_negotiation_prompt import *


class FinishAgent:
    def __init__(self, inputs):
        self.history = inputs["history"]
        self.job_offer = inputs["job_offer"]

    def response(self):

        negotiation_review_prompt = generate_offer_llm_response(
            NEGOTIATION_REVIEW_PROMPT.format(
                history=self.history,
                job_offer=self.job_offer,
                CONCLUDED=CONCLUDED,
                NOT_CONCLUDED=NOT_CONCLUDED,
            )
        )

        if CONCLUDED in negotiation_review_prompt.content:
            reason = "Offer Accepted"
            return {"finish": True, "reason": reason}

        return {"finish": False, "reason": ""}
