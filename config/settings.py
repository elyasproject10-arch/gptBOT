import os
import base64
import hashlib
from dotenv import load_dotenv

# لود کردن متغیرهای محیطی از .env در صورت وجود
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
else:
    # لود از متغیرهای سیستم
    load_dotenv()

class Config:
    BASE_DIR = BASE_DIR
    
    # ربات رسمی تلگرام
    BOT_TOKEN = os.getenv("BOT_TOKEN", "8974112756:AAE0UG5utdloIPcRkFu-fxp_fISMQfK8p_A")
    ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID", "5490508090"))
    
    # اکانت تلگرام کاربر (MTProto)
    TELEGRAM_API_ID = int(os.getenv("TELEGRAM_API_ID", "0")) if os.getenv("TELEGRAM_API_ID") else None
    TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH", "")
    TELEGRAM_PHONE = os.getenv("TELEGRAM_PHONE", "")
    
    # امنیت
    SECRET_KEY = os.getenv("SECRET_KEY", "secure_secret_key_gptbot_admin_panel_v5")
    raw_enc_key = os.getenv("SESSION_ENCRYPTION_KEY", "default_secret_encryption_key_32bytes_")
    # تولید کلید استاندارد ۳۲ بایتی URL-safe base64 برای Fernet
    SESSION_ENCRYPTION_KEY = base64.urlsafe_b64encode(hashlib.sha256(raw_enc_key.encode()).digest())
    
    # دیتابیس
    DB_PATH = os.path.join(BASE_DIR, "database", "app.db")
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
    
    # پنل ادمین
    ADMIN_PORT = int(os.getenv("ADMIN_PORT", "8080"))
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "asd123ASD@#")
    
    # هوش مصنوعی
    AI_ENABLED = os.getenv("AI_ENABLED", "true").lower() in ("true", "1", "yes")
    AI_API_KEY = os.getenv("AI_API_KEY", "")
    AI_MODEL = os.getenv("AI_MODEL", "gemini-1.5-flash")

config = Config()
