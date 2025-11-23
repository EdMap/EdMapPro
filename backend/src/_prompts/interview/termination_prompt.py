DETECT_RUDENESS_PROMPT = """
  here is the the question you asked: \n{current_question}\n\n\n
  here is the answer the candidate gave: \n{current_answer}\n\n\n
  
  You're the interviewer. Determine if the candidate is rude.
  If the candidate is being rude return TRUE and otherwise return FALSE
  then separate it with a colon and return your reasoning in a new line
"""


CANDIDATE_WANTS_TO_STOP_PROMPT = """
  here is the the question you asked: \n{current_question}\n\n\n
  here is the answer the candidate gave: \n{current_answer}\n\n\n
  

  You're the interviewer return TRUE if the candidate EXPLICITLY expresses 
  that they want to stop the interview and return FALSE if otherwise.
"""
