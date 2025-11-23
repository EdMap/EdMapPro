import spacy
from spacy.language import Language
from spacy_langdetect import LanguageDetector


@Language.factory("language_detector")
def get_lang_detector(nlp, name):
    return LanguageDetector()


nlp = spacy.load("en_core_web_sm")
nlp.add_pipe("language_detector", last=True)


def is_english(text):
    doc = nlp(text)
    detect_language = doc._.language
    return detect_language["language"] == "en"
