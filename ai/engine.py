import os
import json
import requests
from config import config
from database import get_db, Setting
from .context_builder import ContextBuilder, DEFAULT_SYSTEM_PROMPT

class AIEngine:
    def __init__(self):
        pass

    def get_api_key(self) -> str:
        with get_db() as db:
            s = db.query(Setting).filter_by(key="ai_api_key").first()
            if s and s.value:
                return s.value.strip()
        return config.AI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    def get_system_prompt(self) -> str:
        with get_db() as db:
            s = db.query(Setting).filter_by(key="ai_system_prompt").first()
            if s and s.value:
                return s.value.strip()
        return DEFAULT_SYSTEM_PROMPT

    def generate_response(self, chat_id: int, current_text: str, history_messages: list = None) -> str:
        api_key = self.get_api_key()
        sys_prompt = self.get_system_prompt()
        prompt_data = ContextBuilder.build_prompt(history_messages or [], current_text, sys_prompt)

        # در صورت وجود کلید گوگل جمینای یا OpenAI
        if api_key:
            try:
                # تلاش با Gemini API v1beta
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{config.AI_MODEL}:generateContent?key={api_key}"
                
                # تبدیل ساختار به فرمت محتوای جمینای
                contents = []
                for p in prompt_data:
                    role = "user" if p["role"] in ("user", "system") else "model"
                    contents.append({
                        "role": role,
                        "parts": [{"text": p["content"]}]
                    })

                resp = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={"contents": contents},
                    timeout=15
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                else:
                    print(f"AI API returned status: {resp.status_code}, response: {resp.text}")
            except Exception as e:
                print(f"Error calling AI API: {e}")

        # در صورت عدم تنظیم کلید یا بروز خطای شبکه، پاسخ هوشمند داخلی برگردانده می‌شود:
        return (
            "سلام و درود! 🌟\n"
            "پیام شما توسط سیستم هوشمند دریافت شد. در حال حاضر همکاران ما در واحد پشتیبانی یا مدیریت نیز به زودی این پیام را بررسی خواهند کرد.\n"
            "در صورتی که درخواست خرید یا تمدید اشتراک دارید، لطفاً از منوی ربات اقدام فرمایید."
        )

ai_engine = AIEngine()
