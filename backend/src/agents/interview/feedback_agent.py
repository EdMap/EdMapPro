from .model_config import generate_interview_llm_response
from src._prompts.interview.feedback_prompt import *


class FeedbackAgent:
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
        feedback = generate_interview_llm_response(
            GENERAL_INTERVIEW_FEEDBACK_PROMPT.format(
                history=self.history,
            )
        )

        areas_for_improvement = generate_interview_llm_response(
            AREAS_FOR_IMPROVEMENT_FEEDBACK_PROMPT.format(
                history=self.history,
            )
        )

        return {
            "feedback": feedback.content,
            "areas_for_improvement": areas_for_improvement.content,
        }
