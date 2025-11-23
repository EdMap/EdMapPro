from src.agents.language_detector import is_english
from .model_config import generate_interview_llm_response
from src._prompts.interview.termination_prompt import *


class TerminationAgent:
    def __init__(self, inputs):
        self.candidate_name = inputs["candidate_name"]
        self.company_name = inputs["company_name"]
        self.current_answer = inputs["current_answer"]
        self.current_question = inputs["current_question"]
        self.history = inputs["history"]
        self.job_description = inputs["job_description"]
        self.position = inputs["position"]
        self.questions = inputs["questions"]
        self.recruiter_name = inputs["recruiter_name"]

    def response(self):
        # if len(self.current_answer.split(" ")) > 3:
        #     if not is_english(self.current_answer):
        #         reason = "You're using a foreign language, please only use English."
        #         return {
        #             "terminate": True,
        #             "reason": reason,
        #         }

        candidate_asked_to_stop_check = generate_interview_llm_response(
            CANDIDATE_WANTS_TO_STOP_PROMPT.format(
                current_answer=self.current_answer,
                current_question=self.current_question,
            )
        )
        if "TRUE" in candidate_asked_to_stop_check.content:
            reason = "You requested to stop the interview."
            return {
                "terminate": True,
                "reason": reason,
            }

        rudeness_response = generate_interview_llm_response(
            DETECT_RUDENESS_PROMPT.format(
                current_answer=self.current_answer,
                current_question=self.current_question,
            )
        )
        if "TRUE" in rudeness_response.content:
            reason = "You were being rude and unreasonable."
            return {
                "terminate": True,
                "reason": rudeness_response.content.replace("TRUE", "").replace(
                    ":", ""
                ),
            }

        return {"terminate": False, "reason": ""}
