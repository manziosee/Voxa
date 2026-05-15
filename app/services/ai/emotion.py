"""
Lightweight keyword-based emotion detection.
A future iteration can swap this for a fine-tuned classifier.
"""

_ANGER_KEYWORDS = {
    "en": ["angry", "furious", "unacceptable", "terrible", "worst", "outrageous", "horrible", "disgusting"],
    "fr": ["en colère", "furieux", "inacceptable", "horrible", "dégoûtant"],
    "sw": ["hasira", "mbaya sana", "kutokubalika"],
    "rw": ["uburakari", "bibi cyane"],
}

_FRUSTRATION_KEYWORDS = {
    "en": ["frustrated", "annoyed", "waiting", "again", "keep", "useless", "still not", "ridiculous"],
    "fr": ["frustré", "agacé", "toujours pas", "ridicule"],
    "sw": ["kukasirika", "bado", "tena"],
    "rw": ["umujinya", "ntibyakozwe"],
}

_HAPPY_KEYWORDS = {
    "en": ["thank", "great", "perfect", "excellent", "love", "wonderful", "amazing"],
    "fr": ["merci", "parfait", "excellent", "super"],
    "sw": ["asante", "vizuri", "bora"],
    "rw": ["murakoze", "byiza", "neza"],
}


def detect_emotion(text: str, language: str = "en") -> str:
    text_lower = text.lower()
    lang = language if language in _ANGER_KEYWORDS else "en"

    for kw in _ANGER_KEYWORDS[lang]:
        if kw in text_lower:
            return "angry"

    for kw in _FRUSTRATION_KEYWORDS[lang]:
        if kw in text_lower:
            return "frustrated"

    for kw in _HAPPY_KEYWORDS[lang]:
        if kw in text_lower:
            return "happy"

    return "neutral"
