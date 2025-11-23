from .model_config import generate_interview_llm_response
from src._prompts.interview.interviewer_prompt import *

INTERVIEWER_WRAPPING_PROMPT = """
    Your name is {recruiter_name} and you're an HR Recruiter for {company_name}. 
    here is the interview history: {interview_history}.\n\n

    given that you've reached the time-limit for the interview start wrapping-up the interview
    
    no other text or thinking about candidate's answer.
"""


class InterviewWrappingAgent:

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
        self.start_time = inputs["start_time"]
        self.time_limit = inputs["time_limit"]
        self.elapsed = inputs["elapsed"]

    def response(self):

        interview_wrapping_prompt = generate_interview_llm_response(
            INTERVIEWER_WRAPPING_PROMPT.format(
                company_name=self.company_name,
                interview_history=self.history,
                recruiter_name=self.recruiter_name,
            )
        )

        if "__DUE__" in interview_wrapping_prompt.content:
            return {
                "finish": True,
                "response": interview_wrapping_prompt.content.replace(
                    "__DUE__", ""
                ).replace(":", ""),
            }

        return {"finish": False, "response": ""}
