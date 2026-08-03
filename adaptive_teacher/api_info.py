"""Static course-assignment metadata returned by the information APIs."""

from __future__ import annotations

from typing import Any

from .config import get_settings


EXAMPLE_PROMPT = (
    "אני אוהב כדורסל. הנה חומר הלימוד: פוטוסינתזה היא התהליך שבו "
    "צמחים משתמשים באור כדי להמיר מים ופחמן דו-חמצני לגלוקוז וחמצן."
)


def team_info() -> dict[str, Any]:
    settings = get_settings()
    return {
        "group_batch_order_number": settings.group_batch_order_number,
        "team_name": settings.team_name,
        "students": [
            {"name": "Batel Shuminov", "email": settings.batel_email},
            {"name": "Itay Shorian", "email": settings.itay_email},
            {"name": "Boaz Cohen", "email": settings.boaz_email},
        ],
    }


def agent_info() -> dict[str, Any]:
    full_response = (
        "קיבלתי את החומר. כדי לחבר את הפוטוסינתזה לכדורסל, דמיין "
        "שהעלה הוא המגרש: אור השמש מספק את האנרגיה, מים ופחמן דו-חמצני "
        "הם השחקנים שנכנסים למהלך, והגלוקוז הוא הנקודות שהצמח מייצר. "
        "החמצן משתחרר כתוצר נוסף. עכשיו שאלה קצרה: אילו שני חומרים "
        "נכנסים לתהליך?"
    )
    return {
        "description": (
            "Adaptive AI Teacher is a conversational ReAct learning agent. A "
            "dynamic LearningSupervisor chooses the most useful tool on every "
            "turn—analysis, interest discovery, explanation, personalized "
            "storytelling, question generation, answer evaluation, direct "
            "response, or stopping. There is no fixed learning path. The supplied "
            "text is authoritative; general model knowledge may enrich explanations "
            "but never overrides conflicting source material. The temporary session "
            "is capped at 16 total LLM calls."
        ),
        "purpose": (
            "Turn plain-text learning material into a personalized, interactive "
            "lesson that adapts to the student's interests, answers, weak topics, "
            "and demonstrated mastery."
        ),
        "prompt_template": {
            "template": (
                "Interests (optional): <what you enjoy>\n"
                "Learning material: <paste plain text>\n"
                "Request (optional): <explain, quiz me, teach through a story, "
                "or let the agent decide>"
            ),
            "example": EXAMPLE_PROMPT,
        },
        "prompt_examples": [
            {
                "prompt": EXAMPLE_PROMPT,
                "full_response": full_response,
                "steps": [
                    {
                        "module": "LearningSupervisor",
                        "prompt": {
                            "System_prompt": "Select exactly one useful action from the available adaptive learning tools. There is no fixed workflow.",
                            "User_prompt": EXAMPLE_PROMPT,
                        },
                        "response": {
                            "action": "StoryTool",
                            "reason": "The student supplied material and an interest that can personalize the explanation.",
                            "tool_instruction": "Explain photosynthesis through a concise basketball analogy and end with one check question.",
                            "direct_response": "",
                        },
                    },
                    {
                        "module": "StoryTool",
                        "prompt": {
                            "System_prompt": "Teach from the authoritative source through a story connected to the student's interests.",
                            "User_prompt": EXAMPLE_PROMPT,
                        },
                        "response": {
                            "response": full_response,
                            "interests": ["כדורסל"],
                            "topics": ["פוטוסינתזה"],
                            "questions": ["אילו שני חומרים נכנסים לתהליך?"],
                        },
                    },
                ],
            }
        ],
    }
