from langchain_groq import ChatGroq
from src.agents.llm import LLM
from src._root.config import GROQ_API_KEY, INTERVIEW_SIM_MODEL


OLLAMA_TEMP = 0.1

INTERVIEW_AI_MODEL = ChatGroq(
    model=INTERVIEW_SIM_MODEL,
    temperature=OLLAMA_TEMP,
    api_key=GROQ_API_KEY,
    stop_sequences=None,
)

generate_interview_llm_response = LLM(INTERVIEW_AI_MODEL).response
