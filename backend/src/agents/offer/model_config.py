from langchain_groq import ChatGroq
from src._root.config import GROQ_API_KEY, OFFER_SIM_MODEL
from src.agents.llm import LLM


OLLAMA_TEMP = 0.5

OFFER_AI_MODEL = ChatGroq(
    model=OFFER_SIM_MODEL,
    temperature=OLLAMA_TEMP,
    api_key=GROQ_API_KEY,
    stop_sequences=None,
)


generate_offer_llm_response = LLM(OFFER_AI_MODEL).response
