import datetime
from typing import Optional, Dict, Any
from database import get_db, User, Chat, Message, Setting

class MessageManager:
    """
    مدیریت و ثبت مرکزی پیام‌های دریافتی و ارسالی از:
    - ربات رسمی تلگرام (Bot API)
    - اکانت شخصی تلگرام (MTProto User Client)
    - پاسخ‌های تولید شده توسط هوش مصنوعی
    - ارسال‌های دستی ادمین از پنل وب
    """

    @staticmethod
    def ensure_chat_and_user(
        chat_id: int,
        sender_id: Optional[int] = None,
        chat_title: Optional[str] = None,
        chat_type: str = "private",
        source: str = "bot",
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        username: Optional[str] = None
    ):
        with get_db() as db:
            # بررسی یا ایجاد چت
            chat = db.query(Chat).filter_by(chat_id=chat_id).first()
            if not chat:
                chat = Chat(
                    chat_id=chat_id,
                    title=chat_title or first_name or str(chat_id),
                    chat_type=chat_type,
                    source=source,
                    is_ai_enabled=True
                )
                db.add(chat)
            else:
                if chat_title:
                    chat.title = chat_title
                chat.updated_at = datetime.datetime.utcnow()

            # بررسی یا ایجاد کاربر
            if sender_id:
                user = db.query(User).filter_by(telegram_id=sender_id).first()
                if not user:
                    user = User(
                        telegram_id=sender_id,
                        first_name=first_name,
                        last_name=last_name,
                        username=username,
                        last_seen=datetime.datetime.utcnow()
                    )
                    db.add(user)
                else:
                    if first_name:
                        user.first_name = first_name
                    if username:
                        user.username = username
                    user.last_seen = datetime.datetime.utcnow()

    @staticmethod
    def record_message(
        chat_id: int,
        sender_type: str, # 'client', 'bot', 'user_account', 'ai'
        text: Optional[str],
        sender_id: Optional[int] = None,
        sender_name: Optional[str] = None,
        message_id: Optional[int] = None,
        media_type: str = "text",
        status: str = "received",
        is_ai_replied: bool = False,
        chat_title: Optional[str] = None,
        chat_type: str = "private",
        source: str = "bot",
        username: Optional[str] = None
    ) -> Message:
        # تضمین وجود چت و کاربر در دیتابیس
        MessageManager.ensure_chat_and_user(
            chat_id=chat_id,
            sender_id=sender_id,
            chat_title=chat_title,
            chat_type=chat_type,
            source=source,
            first_name=sender_name,
            username=username
        )

        with get_db() as db:
            msg = Message(
                message_id=message_id,
                chat_id=chat_id,
                sender_id=sender_id,
                sender_name=sender_name or str(sender_id or "نامشخص"),
                sender_type=sender_type,
                text=text or "",
                media_type=media_type,
                status=status,
                is_ai_replied=is_ai_replied,
                timestamp=datetime.datetime.utcnow()
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)
            return msg

    @staticmethod
    def is_ai_active_for_chat(chat_id: int) -> bool:
        """بررسی فعال بودن هوش مصنوعی به صورت عمومی و اختصاصی برای چت"""
        with get_db() as db:
            global_ai = db.query(Setting).filter_by(key="ai_enabled").first()
            if global_ai and global_ai.value == "false":
                return False

            chat = db.query(Chat).filter_by(chat_id=chat_id).first()
            if chat and not chat.is_ai_enabled:
                return False

        return True

    @staticmethod
    def get_chat_history(chat_id: int, limit: int = 10) -> list:
        """واکشی تاریخچه گفتگوها برای Context ساخت پاسخ هوش مصنوعی"""
        with get_db() as db:
            messages = (
                db.query(Message)
                .filter_by(chat_id=chat_id)
                .order_by(Message.timestamp.desc())
                .limit(limit)
                .all()
            )
            # برگرداندن از قدیمی به جدید برای پرامپت
            return list(reversed(messages))

message_manager = MessageManager()
