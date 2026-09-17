import asyncio
import os
from typing import Optional, Tuple
from pyrogram import Client, filters
from pyrogram.types import Message as PyroMessage
from config import config
from config.crypto import crypto_manager
from database import get_db, SessionStore
from message_manager import message_manager
from ai import ai_engine

class UserClientManager:
    def __init__(self):
        self.client: Optional[Client] = None
        self.phone_code_hash: Optional[str] = None
        self.pending_phone: Optional[str] = None
        self.temp_client: Optional[Client] = None
        self.is_connected = False

    def get_saved_session(self) -> Optional[Tuple[str, int, str]]:
        with get_db() as db:
            s = db.query(SessionStore).filter_by(is_active=True).first()
            if s and s.encrypted_session:
                decrypted = crypto_manager.decrypt(s.encrypted_session)
                if decrypted:
                    return decrypted, s.api_id, s.api_hash
        return None

    async def init_client(self):
        """راه‌اندازی کلاینت با سشن ذخیره‌شده از قبل در دیتابیس"""
        saved = self.get_saved_session()
        if not saved:
            print("[UserClient] No active session found in database.")
            return False

        session_str, api_id, api_hash = saved
        api_id = api_id or config.TELEGRAM_API_ID
        api_hash = api_hash or config.TELEGRAM_API_HASH

        if not api_id or not api_hash:
            print("[UserClient] Telegram API_ID or API_HASH missing.")
            return False

        try:
            self.client = Client(
                name="user_account_session",
                api_id=api_id,
                api_hash=api_hash,
                session_string=session_str,
                in_memory=True
            )
            self._register_handlers()
            await self.client.start()
            me = await self.client.get_me()
            print(f"[UserClient] Successfully connected as: {me.first_name} (@{me.username})")
            self.is_connected = True
            return True
        except Exception as e:
            print(f"[UserClient] Error starting client: {e}")
            self.is_connected = False
            return False

    async def request_code(self, phone: str, api_id: int, api_hash: str) -> dict:
        """مرحله ۱: درخواست ارسال کد تایید به تلگرام شماره داده شده"""
        try:
            self.temp_client = Client(
                name="temp_auth_session",
                api_id=api_id,
                api_hash=api_hash,
                in_memory=True
            )
            await self.temp_client.connect()
            sent_code = await self.temp_client.send_code(phone)
            self.phone_code_hash = sent_code.phone_code_hash
            self.pending_phone = phone
            self.temp_api_id = api_id
            self.temp_api_hash = api_hash
            return {"status": "ok", "message": "کد تأیید به تلگرام شما ارسال شد."}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def verify_code(self, phone_code: str, password_2fa: Optional[str] = None) -> dict:
        """مرحله ۲: بررسی کد تایید و در صورت نیاز پسورد دو مرحله‌ای و ذخیره سشن"""
        if not self.temp_client or not self.pending_phone or not self.phone_code_hash:
            return {"status": "error", "message": "فرآیند احراز هویت منقضی شده است. مجدداً تلاش کنید."}

        try:
            signed_in = False
            try:
                await self.temp_client.sign_in(self.pending_phone, self.phone_code_hash, phone_code)
                signed_in = True
            except Exception as e:
                err_msg = str(e).lower()
                if "password" in err_msg or "sessionpasswordneeded" in err_msg:
                    if password_2fa:
                        await self.temp_client.check_password(password_2fa)
                        signed_in = True
                    else:
                        return {"status": "need_password", "message": "اکانت دارای رمز دومرحله‌ای است. لطفاً پسورد ۲FA را وارد کنید."}
                else:
                    return {"status": "error", "message": str(e)}

            if signed_in:
                # استخراج سشن استرینگ
                session_str = await self.temp_client.export_session_string()
                encrypted_str = crypto_manager.encrypt(session_str)

                # ذخیره امن در دیتابیس
                with get_db() as db:
                    # غیرفعال کردن سشن‌های قبلی
                    db.query(SessionStore).update({SessionStore.is_active: False})
                    new_session = SessionStore(
                        phone_number=self.pending_phone,
                        api_id=self.temp_api_id,
                        api_hash=self.temp_api_hash,
                        encrypted_session=encrypted_str,
                        is_active=True
                    )
                    db.add(new_session)

                # انتساب به کلاینت اصلی
                if self.client and self.is_connected:
                    try:
                        await self.client.stop()
                    except:
                        pass

                self.client = self.temp_client
                self._register_handlers()
                self.is_connected = True
                self.temp_client = None
                return {"status": "ok", "message": "اکانت با موفقیت متصل و سشن به شکل رمزنگاری‌شده ذخیره گردید."}

        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _register_handlers(self):
        """شنود پیام‌های ورودی به اکانت شخصی تلگرام"""
        if not self.client:
            return

        @self.client.on_message(filters.all)
        async def on_user_message(client: Client, message: PyroMessage):
            chat_id = message.chat.id
            text = message.text or message.caption or ""
            is_outgoing = message.outgoing

            chat_type = "private"
            if message.chat.type:
                chat_type = str(message.chat.type).split(".")[-1].lower()

            sender_name = "اکانت من" if is_outgoing else (
                message.from_user.first_name if message.from_user else (message.chat.title or "کاربر")
            )
            sender_id = message.from_user.id if message.from_user else chat_id
            username = f"@{message.from_user.username}" if message.from_user and message.from_user.username else None

            sender_type = "user_account" if is_outgoing else "client"

            # ثبت پیام در Message Manager
            message_manager.record_message(
                chat_id=chat_id,
                sender_id=sender_id,
                sender_name=sender_name,
                username=username,
                sender_type=sender_type,
                text=text,
                message_id=message.id,
                chat_title=message.chat.title or sender_name,
                chat_type=chat_type,
                source="user_client",
                status="sent" if is_outgoing else "received"
            )

            # پاسخگویی خودکار AI در چت‌های خصوصی ورودی (در صورت فعال بودن)
            if not is_outgoing and chat_type == "private" and text and message_manager.is_ai_active_for_chat(chat_id):
                history = message_manager.get_chat_history(chat_id, limit=6)
                ai_reply = ai_engine.generate_response(chat_id, text, history)
                
                # ارسال پاسخ از طرف اکانت تلگرام
                sent_msg = await message.reply_text(ai_reply)

                # ثبت پاسخ AI در دیتابیس
                message_manager.record_message(
                    chat_id=chat_id,
                    sender_type="ai",
                    text=ai_reply,
                    message_id=sent_msg.id,
                    source="user_client",
                    status="sent",
                    is_ai_replied=True
                )

    async def send_message(self, chat_id: int, text: str) -> bool:
        """ارسال پیام دستی از اکانت شخصی به یک چت"""
        if not self.client or not self.is_connected:
            return False
        try:
            msg = await self.client.send_message(chat_id=chat_id, text=text)
            message_manager.record_message(
                chat_id=chat_id,
                sender_type="user_account",
                text=text,
                message_id=msg.id,
                source="user_client",
                status="sent"
            )
            return True
        except Exception as e:
            print(f"[UserClient] Error sending message: {e}")
            return False

user_client = UserClientManager()
