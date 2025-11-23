from src.agents.offer.finish_negotiation_agent import FinishAgent
from src.agents.offer.termination_agent import TerminationAgent
from .model_config import generate_offer_llm_response
from src._prompts.offer_negotiation.negotiation_prompt import *


class NegotiationAgent:
    # TODO (hom): add conditionals salary range for position input
    def __init__(self, inputs):
        self.candidate_name = inputs["candidate_name"]
        self.company_name = inputs["company_name"]
        self.current_answer = inputs["current_answer"]
        self.current_question = inputs["current_question"]
        self.history = inputs["history"]
        self.job_description = inputs["job_description"]
        self.job_offer = inputs["job_offer"]
        self.position = inputs["position"]
        self.recruiter_name = inputs["recruiter_name"]

    def terminate_negotiation(self):
        termination_agent = TerminationAgent(
            {
                "candidate_name": self.candidate_name,
                "company_name": self.company_name,
                "current_answer": self.current_answer,
                "current_question": self.current_question,
                "history": self.history,
                "job_description": self.job_description,
                "job_offer": self.job_offer,
                "position": self.position,
                "recruiter_name": self.recruiter_name,
            }
        )

        response = termination_agent.response()

        return {"terminate": response["terminate"], "reason": response["reason"]}

    def finish_negotiation(self):
        finish_agent = FinishAgent(
            {
                "history": self.history,
                "job_offer": self.job_offer,
            }
        )

        response = finish_agent.response()

        return {"finish": response["finish"], "reason": response["reason"]}

    def generate_response(self):

        if self.terminate_negotiation()["terminate"]:
            response = "Thank you for applying!"

            new_history = self.history + "\n" + response
            return {
                "history": new_history,
                "is_terminated": True,
                "response": response,
            }

        else:
            negotiation_was_concluded = self.finish_negotiation()["finish"]

            if negotiation_was_concluded:
                response = "Thanks, I'll send you the revised offer!"
                new_history = self.history + "\n" + response
                return {
                    "history": new_history,
                    "response": response,
                    "is_terminated": True,
                }

            NEGOTIATOR = NEGOTIATION_PROMPT.format(
                candidate_name=self.candidate_name,
                company_name=self.company_name,
                current_answer=self.current_answer,
                current_question=self.current_question,
                history=self.history,
                job_description=self.job_description,
                position=self.position,
                recruiter_name=self.recruiter_name,
                job_offer=self.job_offer,
            )

            response = generate_offer_llm_response(NEGOTIATOR)
            if response.content in self.history:
                response = generate_offer_llm_response(
                    NEGOTIATOR + " ask another question"
                )

            new_history = self.history + "\n" + response.content
            return {
                "history": new_history,
                "response": response.content,
                "is_terminated": False,
            }
