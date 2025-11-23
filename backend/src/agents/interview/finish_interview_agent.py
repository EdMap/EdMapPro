from src._prompts.interview.interviewer_prompt import QUESTION_REASON_PROMPT
from .model_config import generate_interview_llm_response
from src._prompts.interview.finish_interview_prompt import *


class FinishInterviewAgent:
    def __init__(self, inputs):
        self.candidate_name = inputs["candidate_name"]
        self.company_name = inputs["company_name"]
        self.history = inputs["history"]
        self.position = inputs["position"]
        self.recruiter_name = inputs["recruiter_name"]
        self.start_time = inputs["start_time"]
        self.time_limit = inputs["time_limit"]
        self.elapsed = inputs["elapsed"]

    def response(self):

        interview_review_prompt = generate_interview_llm_response(
            FINISH_INTERVIEW_PROMPT.format(
                history=self.history,
                position=self.position,
                CONCLUDED=CONCLUDED,
                NOT_CONCLUDED=NOT_CONCLUDED,
                start_time=self.start_time,
                elapsed=self.elapsed,
                time_limit=self.time_limit,
            )
        )

        if CONCLUDED in interview_review_prompt.content:
            reason = interview_review_prompt.content.replace(CONCLUDED, "").replace(
                ":", ""
            )

            return {"finish": True, "reason": reason}

        return {"finish": False, "reason": ""}
