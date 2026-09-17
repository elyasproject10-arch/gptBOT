import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=False)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    username = Column(String(255), nullable=True)
    is_admin = Column(Boolean, default=False)
    has_active_sub = Column(Boolean, default=False)
    sub_plan = Column(String(255), nullable=True)
    sub_days = Column(Integer, default=0)
    sub_start_date = Column(String(50), nullable=True)
    license_key = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship("Message", back_populates="user")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chat_id = Column(BigInteger, unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=True)
    chat_type = Column(String(50), default="private") # private, group, supergroup, channel
    source = Column(String(50), default="bot") # bot or user_client
    is_ai_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("Message", back_populates="chat")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(BigInteger, nullable=True)
    chat_id = Column(BigInteger, ForeignKey("chats.chat_id"), index=True, nullable=False)
    sender_id = Column(BigInteger, ForeignKey("users.telegram_id"), index=True, nullable=True)
    sender_name = Column(String(255), nullable=True)
    sender_type = Column(String(50), nullable=False) # 'client' (کاربر چت), 'bot' (ارسال از ربات API), 'user_account' (ارسال از اکانت شخصی), 'ai' (پاسخ هوش مصنوعی)
    text = Column(Text, nullable=True)
    media_type = Column(String(50), default="text") # text, photo, document, voice
    status = Column(String(50), default="received") # received, sent, pending, failed
    is_ai_replied = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    chat = relationship("Chat", back_populates="messages")
    user = relationship("User", back_populates="messages")


class SessionStore(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone_number = Column(String(50), unique=True, nullable=False)
    api_id = Column(Integer, nullable=True)
    api_hash = Column(String(255), nullable=True)
    encrypted_session = Column(Text, nullable=False) # رشته سشن رمزنگاری‌شده با Fernet
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
