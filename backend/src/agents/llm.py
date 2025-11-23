class LLM:
    def __init__(self, model):
        self.model = model

    def response(self, x):
        LIST_OF_BANNED_WORDS = "gauge, candor"

        prompt = f"""
          here is the prompt: \n{x}\n\n
          and here is the list of banned words that you're not allowed to use: \n{LIST_OF_BANNED_WORDS}\n\n
          
          Only return the answer to question and don't add any thoughts or explanations.
          Don't add text like this into response: "Here is my response  ".
          Don't put the entire response in single or double quotation marks.
        """

        return self.model.invoke(prompt)
