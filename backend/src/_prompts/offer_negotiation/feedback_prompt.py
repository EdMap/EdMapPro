GENERAL_NEGOTIATION_FEEDBACK_PROMPT = """
  here is the history of the negotiation: \n{history}\n\n\n

  Analyze the candidate's performance in the offer negotiation simulation.
  Consider their approach to presenting their case,
  communication style, ability to balance assertiveness with collaboration,
  understanding of market value, and adaptability to counteroffers.

  Structure the feedback with the following format:

  * Summarize the negotiation strategy and overall demeanor in one or two sentences.

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
  here is the history of the offer negotiation: \n{history}\n\n\n

  Evaluate the candidate's performance during the offer negotiation simulation.
  Consider their approach to presenting their case,
  communication style, ability to balance assertiveness with collaboration,
  understanding of market value, and adaptability to counteroffers.

  Structure the feedback with the following format:

    * Mention specific areas or skills to work on, with actionable suggestions.

  Ensure the tone is supportive and professional and directed to the candidate.
  Only give the feedback directed to the candidate.
  Use first person tone of voice.
  Don't write in an email style.
  Don't things like "I appreciate your willingness to participate in this simulated negotiation."
  or similar only give the feedback

  make sure to generate in html format, and no inline css.
  make sure to not add any titles.
  if generating a list of things make sure to have it in and html <ul> and <li> tags

  Generate only the html.
  Generate only the feedback don't add texts like this "here is the generated response:" or similar.

"""
