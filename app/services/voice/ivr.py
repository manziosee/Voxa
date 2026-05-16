"""
IVR (Interactive Voice Response) routing.

Businesses can configure a menu that plays before the AI agent engages,
routing callers to specific services (e.g., "Press 1 for appointments,
Press 2 for billing, Press 3 to speak to a human").
"""
from dataclasses import dataclass, field


@dataclass
class IVROption:
    digit: str
    label: str
    action: str
    action_value: str = ""


@dataclass
class IVRMenu:
    intro: str
    options: list[IVROption] = field(default_factory=list)
    language: str = "en"
    timeout_seconds: int = 5
    num_digits: int = 1


def build_ivr_twiml(menu: IVRMenu, base_url: str, call_id: str) -> str:
    """Generate TwiML for an IVR menu with digit-based routing."""
    gather_url = f"{base_url}/api/v1/webhooks/twilio/ivr?call_id={call_id}"

    options_text = " ".join(
        f"Press {opt.digit} for {opt.label}." for opt in menu.options
    )
    full_prompt = f"{menu.intro} {options_text}"

    twiml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        "<Response>",
        f'  <Gather numDigits="{menu.num_digits}" action="{gather_url}" timeout="{menu.timeout_seconds}">',
        f"    <Say>{full_prompt}</Say>",
        "  </Gather>",
        f"  <Say>We didn't receive your input. Goodbye.</Say>",
        "  <Hangup/>",
        "</Response>",
    ]
    return "\n".join(twiml_lines)


def get_default_menu(business_name: str, language: str = "en") -> IVRMenu:
    """Return a sensible default IVR menu in the requested language."""
    menus = {
        "en": IVRMenu(
            intro=f"Welcome to {business_name}.",
            options=[
                IVROption("1", "book an appointment", "ai", "book_appointment"),
                IVROption("2", "speak with our AI assistant", "ai", "general"),
                IVROption("0", "speak to a human agent", "escalate", ""),
            ],
            language="en",
        ),
        "fr": IVRMenu(
            intro=f"Bienvenue chez {business_name}.",
            options=[
                IVROption("1", "prendre un rendez-vous", "ai", "book_appointment"),
                IVROption("2", "parler à notre assistant", "ai", "general"),
                IVROption("0", "parler à un agent humain", "escalate", ""),
            ],
            language="fr",
        ),
        "sw": IVRMenu(
            intro=f"Karibu kwenye {business_name}.",
            options=[
                IVROption("1", "kupanga miadi", "ai", "book_appointment"),
                IVROption("2", "kuzungumza na msaidizi", "ai", "general"),
                IVROption("0", "kuzungumza na mtu halisi", "escalate", ""),
            ],
            language="sw",
        ),
        "rw": IVRMenu(
            intro=f"Murakaza neza kuri {business_name}.",
            options=[
                IVROption("1", "gufata rendez-vous", "ai", "book_appointment"),
                IVROption("2", "kuvugana na AI", "ai", "general"),
                IVROption("0", "kuvugana n'umuntu", "escalate", ""),
            ],
            language="rw",
        ),
    }
    return menus.get(language, menus["en"])
