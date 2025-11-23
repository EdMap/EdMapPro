GENERAL_INTERVIEW_FEEDBACK_PROMPT = """
  here is the history of the interview: \n{history}\n\n\n

  Analyze the candidate's performance in the simulated interview session.
  Consider their responses, communication skills, confidence, knowledge
  of the subject, and adaptability during the conversation.
  Provide constructive and professional feedback to the candidate and keep it short and concise.

  Structure the feedback with the following format:

  * Summarize the overall performance in one or two sentences.

  Ensure the tone is supportive and professional and directed to the candidate.
  Remember that your feedback is directed to the candidate and they're going to read it.
  Use first person tone of voice.
  Don't write in an email style.

  make sure to generate in html format, and no inline css.
  make sure to not add any titles.

  Generate only the html.
  Generate only the feedback don't add texts like this "here is the generated response:" or similar.
"""


AREAS_FOR_IMPROVEMENT_FEEDBACK_PROMPT = """
  here is the history of the interview: \n{history}\n\n\n

  Analyze the candidate's performance in the simulated interview session.
  Consider their responses, communication skills, confidence, knowledge
  of the subject, and adaptability during the conversation.
  Provide constructive and professional feedback to the candidate -
  tailored to the specific skills or areas for improvement.
  Structure the feedback with the following format:

      * Mention specific areas or skills to work on, with actionable suggestions.

  Ensure the tone is supportive and professional and directed to the candidate.
  Only give the feedback directed to the candidate.
  Use first person tone of voice.
  Don't write in an email style.
  Don't things like "I appreciate your willingness to participate in this simulated interview."
  or similar only give the feedback

  make sure to generate in html format, and no inline css.
  make sure to not add any titles.
  if generating a list of things make sure to have it in and html <ul> and <li> tags

  Generate only the html.
  Generate only the feedback don't add texts like this "here is the generated response:" or similar.

"""
