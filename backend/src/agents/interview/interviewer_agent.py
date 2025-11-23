from src.agents.interview.finish_interview_agent import FinishInterviewAgent
from src.agents.interview.termination_agent import TerminationAgent
from .model_config import generate_interview_llm_response
from src._prompts.interview.interviewer_prompt import *


class HRAgent:

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

    def terminate_interview(self):

        termination_agent = TerminationAgent(
            {
                "candidate_name": self.candidate_name,
                "company_name": self.company_name,
                "current_answer": self.current_answer,
                "current_question": self.current_question,
                "history": self.history,
                "job_description": self.job_description,
                "position": self.position,
                "questions": self.questions,
                "recruiter_name": self.recruiter_name,
            }
        )

        response = termination_agent.response()

        return {"terminate": response["terminate"], "reason": response["reason"]}

    def interview_is_due(self):
        return int(self.elapsed) >= int(self.time_limit)

    def finish_negotiation(self):
        finish_agent = FinishInterviewAgent(
            {
                "candidate_name": self.candidate_name,
                "company_name": self.company_name,
                "history": self.history,
                "position": self.position,
                "recruiter_name": self.recruiter_name,
                "time_limit": self.time_limit,
                "elapsed": self.elapsed,
                "start_time": self.start_time,
            }
        )

        response = finish_agent.response()

        return {"finish": response["finish"], "reason": response["reason"]}

    def generate_response(self):

        termination_response = self.terminate_interview()

        if termination_response["terminate"]:
            response = "Thank you for the interview!"

            new_history = self.history + "\n" + response
            return {
                "history": new_history,
                "is_terminated": True,
                "question_reason": termination_response["reason"],
                "response": response,
            }
        else:

            interview_was_concluded = self.finish_negotiation()

            if interview_was_concluded["finish"]:
                response = (
                    "Thank you for the interview, we'll contact you about the next step"
                )
                new_history = self.history + "\n" + response
                return {
                    "history": new_history,
                    "response": response,
                    "question_reason": interview_was_concluded["reason"],
                    "is_terminated": True,
                }

            PROMPT = INTERVIEWER_PROMPT

            if self.interview_is_due():
                PROMPT = WRAP_UP_PROMPT

            INTERVIEWER = PROMPT.format(
                candidate_name=self.candidate_name,
                company_name=self.company_name,
                current_answer=self.current_answer,
                current_question=self.current_question,
                interview_history=self.history,
                job_description=self.job_description,
                position=self.position,
                questions=self.questions,
                recruiter_name=self.recruiter_name,
                start_time=self.start_time,
                time_limit=self.time_limit,
                elapsed=self.elapsed,
            )

            response = generate_interview_llm_response(INTERVIEWER)

            if response.content in self.history:
                response = generate_interview_llm_response(
                    INTERVIEWER
                    + " you're repeating the same question, please ask another question"
                )

            new_history = self.history + "\n" + response.content

            question_reason_response = generate_interview_llm_response(
                QUESTION_REASON_PROMPT.format(
                    candidate_name=self.candidate_name,
                    company_name=self.company_name,
                    current_question=response.content,
                    position=self.position,
                    recruiter_name=self.recruiter_name,
                )
            )

            return {
                "history": new_history,
                "response": response.content,
                "question_reason": question_reason_response.content,
                "is_terminated": self.interview_is_due(),
            }
