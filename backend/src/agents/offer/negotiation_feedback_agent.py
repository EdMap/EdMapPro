from .model_config import generate_offer_llm_response
from src._prompts.offer_negotiation.feedback_prompt import *


class NegotiationFeedbackAgent:
    def __init__(self, inputs):
        self.candidate_name = inputs["candidate_name"]
        self.company_name = inputs["company_name"]
        self.history = inputs["history"]
        self.recruiter_name = inputs["recruiter_name"]

    def response(self):
        feedback = generate_offer_llm_response(
            GENERAL_NEGOTIATION_FEEDBACK_PROMPT.format(
                history=self.history,
                candidate_name=self.candidate_name,
                company_name=self.company_name,
                recruiter_name=self.recruiter_name,
            )
        )

        areas_for_improvement = generate_offer_llm_response(
            AREAS_FOR_IMPROVEMENT_FEEDBACK_PROMPT.format(
                history=self.history,
                candidate_name=self.candidate_name,
                company_name=self.company_name,
                recruiter_name=self.recruiter_name,
            )
        )

        return {
            "feedback": feedback.content,
            "areas_for_improvement": areas_for_improvement.content,
        }
