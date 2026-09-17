from typing import List
from database import Message

DEFAULT_SYSTEM_PROMPT = """شما یک دستیار هوش مصنوعی هوشمند، حرفه‌ای و مودب به زبان فارسی هستید.
وظیفه شما راهنمایی دقیق، پاسخ به سوالات مشتریان، ارائه توضیحات درباره محصولات و خدمات، و حل مشکلات آنها با لحنی محترمانه و صمیمی است.
پاسخ‌ها را مختصر، مفید و روان ارائه دهید."""

class ContextBuilder:
    @staticmethod
    def build_prompt(history: List[Message], current_message: str, system_prompt: str = None) -> List[dict]:
        sys_prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
        formatted_messages = [
            {"role": "system", "content": sys_prompt}
        ]

        for msg in history:
            if not msg.text:
                continue
            role = "user" if msg.sender_type in ("client", "user_account") else "assistant"
            formatted_messages.append({
                "role": role,
                "content": f"{msg.sender_name or 'کاربر'}: {msg.text}" if role == "user" else msg.text
            })

        # افزودن پیام فعلی
        formatted_messages.append({
            "role": "user",
            "content": current_message
        })

        return formatted_messages
