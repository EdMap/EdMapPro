import random
from src._prompts.interview.greeting_prompt import *


class GreetingAgent:
    def __init__(self, inputs):
        self.candidate_name = inputs["candidate_name"]
        self.company_name = inputs["company_name"]
        self.history = inputs["history"]
        self.job_description = inputs["job_description"]
        self.position = inputs["position"]
        self.questions = inputs["questions"]
        self.recruiter_name = inputs["recruiter_name"]

    def response(self):
        PROMPT = random.choice(GREETING_PROMPTS)

        greeting = PROMPT.format(
            candidate_name=self.candidate_name,
            company_name=self.company_name,
            position=self.position,
            recruiter_name=self.recruiter_name,
        )

        new_history = self.history + " " + greeting
        return {
            "history": new_history,
            "response": greeting,
            "is_terminated": False,
            "question_reason": "",
        }
