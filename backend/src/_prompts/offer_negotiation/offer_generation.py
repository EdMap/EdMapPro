INITIAL_OFFER_PROMPT = """
  candidate's first name: {candidate_name}.\n
  position: {position}. \n
  company name: {company_name}.\n
  recruiter name: {recruiter_name}.\n
  offer due date: {offer_due_date}. \n
  start date: {start_date}. \n
  initial offer: \n{initial_offer}. \n\n
  negotiation history: \n{history}. \n\n

  Generate a job offer for the candidate.
  Don't forget to add salary.
  Generate in HTML format
  
  make sure to generate in html format, and no inline css.
  make sure to not add any titles.
    
  Generate only the html.
  Generate only the offer don't add texts like this "here is the generated response:" or similar.

"""


OFFER_PROMPT = """
  candidate's first name: {candidate_name}.\n
  position: {position}. \n
  company name: {company_name}.\n
  recruiter name: {recruiter_name}.\n
  offer due date: {offer_due_date}. \n
  start date: {start_date}. \n\n
  initial offer: \n{initial_offer}. \n\n
  negotiation history: \n{history}. \n\n

  Based on the negotiation history generate a new job offer for the candidate.
  Don't forget to add salary.
  Generate in HTML format
  
  make sure to generate in html format, and no inline css.
  make sure to not add any titles.
    
  Generate only the html.
  Generate only the offer don't add texts like this "here is the generated response:" or similar.

"""
