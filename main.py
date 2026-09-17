import os
import sys
import threading
import asyncio
from config import config
from database import init_db
from bot.bot_service import bot
from admin.app import admin_app
from user_client import user_client

def run_flask():
    """اجرای وب‌سرور پنل مدیریت ادمین روی پورت مشخص‌شده"""
    print(f"[Admin] Starting Web Admin Dashboard on port {config.ADMIN_PORT}...")
    admin_app.run(host="0.0.0.0", port=config.ADMIN_PORT, debug=False, use_reloader=False)

def run_bot_polling():
    """اجرای پولینگ ربات رسمی تلگرام"""
    print("[Bot] Starting Telegram Bot API polling...")
    while True:
        try:
            bot.infinity_polling(timeout=20, long_polling_timeout=20)
        except Exception as e:
            print(f"[Bot] Polling error: {e}")
            import time
            time.sleep(3)

def start_services():
    print("=" * 60)
    print("🚀 Initializing Service-Based Telegram Bot & MTProto Architecture")
    print("=" * 60)

    # ۱. راه‌اندازی دیتابیس و مایگریشن اطلاعات قدیمی
    init_db()
    print("[DB] Database initialized and migrated successfully.")

    # ۲. راه‌اندازی ترد وب‌پنل ادمین
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # ۳. راه‌اندازی کلاینت MTProto در پس‌زمینه در صورت وجود سشن قبلی
    def start_userbot_loop():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(user_client.init_client())
            loop.run_forever()
        except Exception as e:
            print(f"[UserClient] Background loop error: {e}")

    userbot_thread = threading.Thread(target=start_userbot_loop, daemon=True)
    userbot_thread.start()

    # ۴. اجرای ربات تلگرام در ترد اصلی
    run_bot_polling()

if __name__ == "__main__":
    start_services()
