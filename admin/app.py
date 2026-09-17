import os
import json
import asyncio
from flask import Flask, request, render_template_string, redirect, session, jsonify
from config import config
from database import get_db, User, Chat, Message, SessionStore, Setting
from message_manager import message_manager
from ai import ai_engine
from user_client import user_client
from bot.bot_service import bot, get_plans, save_plans

admin_app = Flask(__name__)
admin_app.secret_key = config.SECRET_KEY

# حلقه رویدادهای Asyncio برای فراخوانی توابع async اکانت شخصی از فلاسک
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

def run_async(coro):
    return loop.run_until_complete(coro)

def get_setting(key: str, default: str = "") -> str:
    with get_db() as db:
        s = db.query(Setting).filter_by(key=key).first()
        return s.value if s and s.value is not None else default

def set_setting(key: str, val: str):
    with get_db() as db:
        s = db.query(Setting).filter_by(key=key).first()
        if not s:
            s = Setting(key=key, value=val)
            db.add(s)
        else:
            s.value = val

# قالب فوق پیشرفته و مدرن HTML
HTML_LOGIN = """
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>ورود به داشبورد جامع مدیریت</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Vazirmatn', sans-serif; }
        body {
            background: radial-gradient(circle at 50% 20%, #172033 0%, #080c14 100%);
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 20px;
        }
        .login-card {
            background: rgba(18, 26, 44, 0.9);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 20px;
            padding: 40px 32px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
        }
        .logo-badge {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #0284c7, #0ea5e9);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            margin: 0 auto 16px auto;
        }
        h2 { text-align: center; margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
        p.subtitle { text-align: center; font-size: 13px; color: #94a3b8; margin: 0 0 24px 0; }
        .form-group { margin-bottom: 18px; }
        label { display: block; font-size: 13px; font-weight: 500; color: #cbd5e1; margin-bottom: 6px; }
        input {
            width: 100%;
            padding: 13px 16px;
            background: #0b1120;
            border: 1px solid #1e293b;
            border-radius: 12px;
            color: #f8fafc;
            font-size: 14px;
        }
        input:focus { border-color: #38bdf8; outline: none; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15); }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            border: none;
            color: white;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
        }
        .err {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #f87171;
            padding: 12px;
            border-radius: 10px;
            font-size: 13px;
            margin-bottom: 18px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="login-card">
        <div class="logo-badge">⚡</div>
        <h2>ورود به پنل مدیریت جامع</h2>
        <p class="subtitle">سیستم مدیریت Bot API + User Client + AI</p>
        {% if error %}<div class="err">{{ error }}</div>{% endif %}
        <form method="POST">
            <div class="form-group">
                <label>نام کاربری:</label>
                <input type="text" name="username" required autocomplete="off" placeholder="admin">
            </div>
            <div class="form-group">
                <label>رمز عبور:</label>
                <input type="password" name="password" required placeholder="••••••••">
            </div>
            <button type="submit">ورود به پنل</button>
        </form>
    </div>
</body>
</html>
"""

HTML_ADMIN = """
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>پنل مدیریت سرویس‌محور تلگرام + هوش مصنوعی</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Vazirmatn', sans-serif; }
        body { background-color: #070b13; color: #f1f5f9; margin: 0; padding: 24px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .topbar {
            display: flex; justify-content: space-between; align-items: center;
            background: #0f172a; border: 1px solid #1e293b; padding: 16px 24px;
            border-radius: 16px; margin-bottom: 24px;
        }
        .brand { display: flex; align-items: center; gap: 14px; }
        .brand-icon {
            width: 44px; height: 44px; background: linear-gradient(135deg, #0284c7, #38bdf8);
            border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px;
        }
        .brand-title { margin: 0; font-size: 18px; font-weight: 700; color: #f8fafc; }
        .brand-sub { margin: 0; font-size: 12px; color: #94a3b8; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card {
            background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 20px;
            position: relative; overflow: hidden;
        }
        .stat-title { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .stat-number { font-size: 26px; font-weight: 800; color: #f8fafc; margin-top: 6px; }
        .stat-desc { font-size: 12px; color: #38bdf8; margin-top: 4px; }
        
        .nav-tabs {
            display: flex; gap: 8px; background: #0f172a; padding: 8px; border-radius: 14px;
            border: 1px solid #1e293b; margin-bottom: 24px; overflow-x: auto;
        }
        .tab-btn {
            background: transparent; border: none; color: #94a3b8; padding: 10px 18px;
            border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer;
            transition: all 0.2s; white-space: nowrap;
        }
        .tab-btn.active { background: #0284c7; color: #fff; }
        .tab-view { display: none; }
        .tab-view.active { display: block; }
        
        .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 18px; padding: 24px; margin-bottom: 24px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
        .card-title { margin: 0; font-size: 16px; font-weight: 700; color: #f8fafc; }
        
        .grid-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 13px; font-weight: 500; color: #cbd5e1; margin-bottom: 6px; }
        input, select, textarea {
            width: 100%; padding: 11px 14px; background: #090d16; border: 1px solid #1e293b;
            border-radius: 10px; color: #f8fafc; font-size: 13.5px;
        }
        textarea { resize: vertical; min-height: 85px; line-height: 1.6; }
        input:focus, select:focus, textarea:focus { border-color: #0284c7; outline: none; }
        
        .btn {
            display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
            border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; border: none; text-decoration: none;
        }
        .btn-primary { background: #0284c7; color: white; }
        .btn-success { background: #10b981; color: white; }
        .btn-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
        
        table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13.5px; }
        th { background: #1e293b; color: #cbd5e1; padding: 12px 16px; text-align: right; }
        td { padding: 14px 16px; border-bottom: 1px solid #1e293b; color: #e2e8f0; }
        
        .badge { padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; }
        .badge-success { background: rgba(16, 185, 129, 0.2); color: #34d399; }
        .badge-info { background: rgba(14, 165, 233, 0.2); color: #38bdf8; }
        .badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        .badge-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        
        .alert-box { background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.3); color: #38bdf8; padding: 14px 18px; border-radius: 12px; font-size: 13.5px; margin-bottom: 20px; }
        .code-box { background: #090d16; padding: 4px 8px; border-radius: 6px; border: 1px solid #1e293b; font-family: monospace; color: #38bdf8; font-size: 12px; }
        
        /* چت باکس */
        .chat-container { display: flex; height: 550px; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; background: #090d16; }
        .chat-list { width: 320px; border-left: 1px solid #1e293b; overflow-y: auto; background: #0c121e; }
        .chat-item { padding: 14px 16px; border-bottom: 1px solid #1e293b; cursor: pointer; transition: background 0.2s; }
        .chat-item:hover, .chat-item.active { background: #172033; }
        .chat-main { flex: 1; display: flex; flex-direction: column; }
        .chat-header { padding: 14px 20px; border-bottom: 1px solid #1e293b; background: #0f172a; display: flex; justify-content: space-between; align-items: center; }
        .chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #070b13; }
        .bubble { max-width: 70%; padding: 10px 16px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; }
        .bubble.incoming { background: #1e293b; color: #f8fafc; align-self: flex-start; border-bottom-right-radius: 4px; }
        .bubble.outgoing { background: #0284c7; color: #fff; align-self: flex-end; border-bottom-left-radius: 4px; }
        .bubble.ai { background: #4f46e5; color: #fff; align-self: flex-end; border-bottom-left-radius: 4px; }
        .chat-footer { padding: 14px 20px; border-top: 1px solid #1e293b; background: #0f172a; display: flex; gap: 10px; align-items: center; }
    </style>
</head>
<body>
    <div class="container">
        <!-- هدر بالا -->
        <div class="topbar">
            <div class="brand">
                <div class="brand-icon">⚡</div>
                <div>
                    <h1 class="brand-title">سیستم یکپارچه مدیریت تلگرام و هوش مصنوعی</h1>
                    <p class="brand-sub">مدیریت Bot API + اکانت MTProto + پاسخگویی هوشمند AI + پایگاه داده</p>
                </div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
                {% if user_client_active %}
                <span class="badge badge-success">🟢 اکانت تلگرام متصل است</span>
                {% else %}
                <span class="badge badge-warning">🟡 اکانت شخصی متصل نیست</span>
                {% endif %}
                <a href="/logout" class="btn btn-secondary">خروج</a>
            </div>
        </div>

        {% if msg %}
        <div class="alert-box">✨ {{ msg }}</div>
        {% endif %}

        <!-- کارت‌های آمار -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-title">کل پیام‌های ثبت‌شده</div>
                <div class="stat-number">{{ stats.total_messages }}</div>
                <div class="stat-desc">در پایگاه داده</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">تعداد چت‌ها و مخاطبان</div>
                <div class="stat-number">{{ stats.total_chats }}</div>
                <div class="stat-desc">ربات و اکانت</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">مشترکین فعال</div>
                <div class="stat-number">{{ stats.active_subs }}</div>
                <div class="stat-desc">دارای اشتراک فعال</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">وضعیت سیستم هوش مصنوعی</div>
                <div class="stat-number">{% if stats.ai_enabled %}فعال 🟢{% else %}غیرفعال 🔴{% endif %}</div>
                <div class="stat-desc">{{ stats.ai_model }}</div>
            </div>
        </div>

        <!-- تب‌های پنل -->
        <div class="nav-tabs">
            <button class="tab-btn active" onclick="showTab('messages')">💬 مرکز پیام‌ها و گفتگوها</button>
            <button class="tab-btn" onclick="showTab('userbot')">📱 اتصال اکانت تلگرام (MTProto)</button>
            <button class="tab-btn" onclick="showTab('ai_settings')">🧠 تنظیمات هوش مصنوعی (AI)</button>
            <button class="tab-btn" onclick="showTab('plans')">💎 مدیریت پلن‌ها و تعرفه‌ها</button>
            <button class="tab-btn" onclick="showTab('users')">👥 مدیریت کاربران و اشتراک‌ها</button>
            <button class="tab-btn" onclick="showTab('bot_texts')">✏️ متن‌های ربات و درگاه</button>
            <button class="tab-btn" onclick="showTab('security')">🔐 امنیت و رمز ورود</button>
        </div>

        <!-- تب ۱: مرکز پیام‌ها (Message Manager) -->
        <div id="tab-messages" class="tab-view active">
            <div class="card" style="padding: 16px;">
                <div class="chat-container">
                    <!-- ستون چت‌ها -->
                    <div class="chat-list">
                        {% for c in chats %}
                        <div class="chat-item {% if active_chat and active_chat.chat_id == c.chat_id %}active{% endif %}" onclick="location.href='/admin?chat_id={{ c.chat_id }}'">
                            <div style="font-weight: 600; font-size: 13.5px; color: #f8fafc;">{{ c.title or c.chat_id }}</div>
                            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11.5px; color: #94a3b8;">
                                <span>{{ c.source }} ({{ c.chat_type }})</span>
                                {% if c.is_ai_enabled %}
                                <span style="color:#34d399;">AI روشن</span>
                                {% else %}
                                <span style="color:#f87171;">AI خاموش</span>
                                {% endif %}
                            </div>
                        </div>
                        {% else %}
                        <div style="padding: 20px; color: #94a3b8; text-align: center; font-size: 13px;">هنوز پیامی دریافت نشده است.</div>
                        {% endfor %}
                    </div>

                    <!-- بخش اصلی پیام‌ها -->
                    <div class="chat-main">
                        {% if active_chat %}
                        <div class="chat-header">
                            <div>
                                <b style="color: #38bdf8;">{{ active_chat.title or active_chat.chat_id }}</b>
                                <span class="code-box" style="margin-right: 8px;">{{ active_chat.chat_id }}</span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <a href="/admin/toggle_chat_ai/{{ active_chat.chat_id }}" class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px;">
                                    {% if active_chat.is_ai_enabled %}🔴 غیرفعال‌سازی AI این چت{% else %}🟢 فعال‌سازی AI این چت{% endif %}
                                </a>
                            </div>
                        </div>

                        <div class="chat-messages">
                            {% for m in active_messages %}
                            <div class="bubble {% if m.sender_type in ('client') %}incoming{% elif m.sender_type == 'ai' %}ai{% else %}outgoing{% endif %}">
                                <div style="font-size: 11px; opacity: 0.8; margin-bottom: 3px;">
                                    {% if m.sender_type == 'ai' %}🤖 هوش مصنوعی{% elif m.sender_type == 'user_account' %}📱 اکانت شخصی{% elif m.sender_type == 'bot' %}🤖 ربات رسمی{% else %}👤 {{ m.sender_name }}{% endif %}
                                </div>
                                <div>{{ m.text }}</div>
                                <div style="font-size: 10px; opacity: 0.6; text-align: left; margin-top: 4px;">{{ m.timestamp.strftime('%H:%M') if m.timestamp else '' }}</div>
                            </div>
                            {% else %}
                            <div style="text-align: center; color: #94a3b8; margin: auto;">پیامی در این گفتگو وجود ندارد.</div>
                            {% endfor %}
                        </div>

                        <form method="POST" action="/admin/send_manual_message" class="chat-footer">
                            <input type="hidden" name="chat_id" value="{{ active_chat.chat_id }}">
                            <select name="send_as" style="width: 150px;">
                                <option value="bot">ارسال از: ربات API</option>
                                {% if user_client_active %}
                                <option value="user_account">ارسال از: اکانت شخصی</option>
                                {% endif %}
                            </select>
                            <input type="text" name="message_text" placeholder="متن پیام خود را بنویسید..." required>
                            <button type="submit" class="btn btn-primary">ارسال دستی</button>
                            <a href="/admin/reply_with_ai/{{ active_chat.chat_id }}" class="btn btn-success" style="white-space: nowrap;">⚡ پاسخ با AI</a>
                        </form>
                        {% else %}
                        <div style="margin: auto; text-align: center; color: #94a3b8;">
                            <h3>👈 یک چت را از لیست سمت راست انتخاب کنید</h3>
                            <p>پیام‌های اکانت تلگرام یا ربات در این قسمت نمایش و قابل پاسخگویی هستند.</p>
                        </div>
                        {% endif %}
                    </div>
                </div>
            </div>
        </div>

        <!-- تب ۲: لاگین و مدیریت اکانت تلگرام MTProto -->
        <div id="tab-userbot" class="tab-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📱 اتصال اکانت شخصی تلگرام با پروتکل امن MTProto</h2>
                </div>
                <p style="font-size: 13.5px; color: #94a3b8;">
                    با اتصال اکانت شخصی، سیستم می‌تواند پیام‌های خصوصی، گروه‌ها و کانال‌های اکانت شما را دریافت کرده و با هوش مصنوعی به آن‌ها پاسخ دهد.<br>
                    سشن تولید شده با کلید اختصاصی Fernet به شکل کاملاً رمزگذاری‌شده ذخیره می‌شود.
                </p>

                {% if user_client_active %}
                <div class="alert-box" style="border-color: rgba(16, 185, 129, 0.4); color: #34d399;">
                    ✅ اکانت شخصی تلگرام شما در حال حاضر متصل و فعال است.
                </div>
                {% endif %}

                <!-- فرم مرحله ۱: شماره تلفن -->
                <div style="background: #090d16; padding: 20px; border-radius: 12px; border: 1px solid #1e293b; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; font-size: 15px; color: #38bdf8;">مرحله اول: ارسال کد ورود به تلگرام</h3>
                    <form method="POST" action="/admin/userbot/send_code">
                        <div class="grid-form">
                            <div class="form-group">
                                <label>شماره تلفن (همراه با کد کشور):</label>
                                <input type="text" name="phone" placeholder="+989123456789" required>
                            </div>
                            <div class="form-group">
                                <label>API ID تلگرام (از my.telegram.org):</label>
                                <input type="number" name="api_id" placeholder="مثال: 1234567" value="{{ default_api_id or '' }}" required>
                            </div>
                            <div class="form-group">
                                <label>API HASH تلگرام:</label>
                                <input type="text" name="api_hash" placeholder="کد ۳۲ کاراکتری" value="{{ default_api_hash or '' }}" required>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">📩 درخواست ارسال کد تایید</button>
                    </form>
                </div>

                <!-- فرم مرحله ۲: وارد کردن کد تایید -->
                <div style="background: #090d16; padding: 20px; border-radius: 12px; border: 1px solid #1e293b;">
                    <h3 style="margin-top: 0; font-size: 15px; color: #38bdf8;">مرحله دوم: ثبت کد تأیید دریافتی در تلگرام</h3>
                    <form method="POST" action="/admin/userbot/verify_code">
                        <div class="grid-form">
                            <div class="form-group">
                                <label>کد ۵ رقمی ارسال شده به تلگرام:</label>
                                <input type="text" name="phone_code" placeholder="مثال: 12345" required>
                            </div>
                            <div class="form-group">
                                <label>رمز عبور دو مرحله‌ای (۲FA) - فقط در صورت فعال بودن:</label>
                                <input type="password" name="password_2fa" placeholder="رمز ۲FA (اختیاری)">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success">🔑 تایید نهایی و اتصال اکانت</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- تب ۳: هوش مصنوعی -->
        <div id="tab-ai_settings" class="tab-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🧠 تنظیمات مدل هوش مصنوعی (AI Settings)</h2>
                </div>
                <form method="POST" action="/admin/update_ai_settings">
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" name="ai_enabled" value="true" {% if ai_enabled %}checked{% endif %} style="width: auto;">
                            <span>سیستم پاسخگویی هوش مصنوعی به طور کلی فعال باشد</span>
                        </label>
                    </div>
                    <div class="grid-form">
                        <div class="form-group">
                            <label>کلید API هوش مصنوعی (Gemini API Key):</label>
                            <input type="password" name="ai_api_key" value="{{ ai_api_key }}" placeholder="AIzaSy...">
                        </div>
                        <div class="form-group">
                            <label>مدل هوش مصنوعی:</label>
                            <select name="ai_model">
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (سریع و بهینه)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (پیشرفته و عمیق)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>پرامپت رفتاری سیستم (System Instruction):</label>
                        <textarea name="ai_system_prompt" style="min-height: 120px;">{{ ai_system_prompt }}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">💾 ذخیره تنظیمات هوش مصنوعی</button>
                </form>
            </div>
        </div>

        <!-- تب ۴: پلن‌ها -->
        <div id="tab-plans" class="tab-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">➕ ایجاد پلن یا محصول جدید</h2>
                </div>
                <form method="POST" action="/admin/add_plan">
                    <div class="grid-form">
                        <div class="form-group">
                            <label>نام پلن یا اشتراک:</label>
                            <input type="text" name="name" placeholder="مثال: اشتراک طلایی VIP" required>
                        </div>
                        <div class="form-group">
                            <label>قیمت به تومان:</label>
                            <input type="number" name="price" placeholder="مثال: 220000" required>
                        </div>
                        <div class="form-group">
                            <label>مدت زمان اعتبار (روز):</label>
                            <input type="number" name="days" placeholder="مثال: 90" required>
                        </div>
                    </div>
                    <div class="grid-form">
                        <div class="form-group" style="grid-column: span 2;">
                            <label>لینک درگاه پرداخت پی‌پینگ اختصاصی این پلن:</label>
                            <input type="text" name="pay_url" placeholder="https://payping.ir/d/XXXXXX" required>
                        </div>
                        <div class="form-group">
                            <label>توضیحات کوتاه پلن (اختیاری):</label>
                            <input type="text" name="desc" placeholder="سرعت بالا، پشتیبانی ۲۴ ساعته">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-success">➕ ذخیره پلن</button>
                </form>
            </div>

            <div class="card">
                <div class="card-header"><h2 class="card-title">📋 پلن‌های فعال</h2></div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>نام پلن</th>
                                <th>قیمت (تومان)</th>
                                <th>مدت</th>
                                <th>توضیحات</th>
                                <th>لینک درگاه</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for key, p in plans.items() %}
                            <tr>
                                <td><b style="color:#38bdf8;">{{ p.name }}</b></td>
                                <td>{{ "{:,}".format(p.price|int) }} تومان</td>
                                <td>{{ p.days }} روز</td>
                                <td>{{ p.desc or '-' }}</td>
                                <td><a href="{{ p.pay_url }}" target="_blank" style="color:#0ea5e9;">مشاهده درگاه ↗</a></td>
                                <td>
                                    <a href="/admin/delete_plan/{{ key }}" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="return confirm('پلن حذف شود؟')">حذف</a>
                                </td>
                            </tr>
                            {% else %}
                            <tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">هیچ پلنی هنوز تعریف نشده است.</td></tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- تب ۵: کاربران -->
        <div id="tab-users" class="tab-view">
            <div class="card">
                <div class="card-header"><h2 class="card-title">👥 لیست کاربران ثبت‌شده در پایگاه داده</h2></div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>آیدی تلگرام</th>
                                <th>نام</th>
                                <th>نام کاربری</th>
                                <th>وضعیت اشتراک</th>
                                <th>پلن</th>
                                <th>کد لایسنس</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for u in users %}
                            <tr>
                                <td><span class="code-box">{{ u.telegram_id }}</span></td>
                                <td><b>{{ u.first_name }}</b></td>
                                <td>{{ u.username or '-' }}</td>
                                <td>
                                    {% if u.has_active_sub %}
                                    <span class="badge badge-success">✅ فعال</span>
                                    {% else %}
                                    <span class="badge badge-warning">غیرفعال</span>
                                    {% endif %}
                                </td>
                                <td>{{ u.sub_plan or '-' }}</td>
                                <td><span class="code-box">{{ u.license_key or '-' }}</span></td>
                                <td>
                                    {% if u.has_active_sub %}
                                    <a href="/admin/revoke_user_sub/{{ u.telegram_id }}" class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;">ابطال</a>
                                    {% endif %}
                                </td>
                            </tr>
                            {% else %}
                            <tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 20px;">هنوز کاربری ثبت نشده است.</td></tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- تب ۶: متون ربات -->
        <div id="tab-bot_texts" class="tab-view">
            <div class="card">
                <div class="card-header"><h2 class="card-title">✏️ متن‌های ربات و اطلاعات کارت به کارت</h2></div>
                <form method="POST" action="/admin/update_bot_texts">
                    <div class="form-group">
                        <label>پیام خوش‌آمدگویی استارت ربات:</label>
                        <textarea name="welcome_text">{{ bot_settings.welcome_text }}</textarea>
                    </div>
                    <div class="form-group">
                        <label>متن تیتر بالای تعرفه‌ها:</label>
                        <textarea name="plans_header_text">{{ bot_settings.plans_header_text }}</textarea>
                    </div>
                    <div class="grid-form">
                        <div class="form-group">
                            <label>شماره کارت بانکی:</label>
                            <input type="text" name="card_number" value="{{ bot_settings.card_number }}">
                        </div>
                        <div class="form-group">
                            <label>نام صاحب حساب:</label>
                            <input type="text" name="card_holder" value="{{ bot_settings.card_holder }}">
                        </div>
                        <div class="form-group">
                            <label>نام بانک:</label>
                            <input type="text" name="bank_name" value="{{ bot_settings.bank_name }}">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">💾 ذخیره تغییرات متن‌ها</button>
                </form>
            </div>
        </div>

        <!-- تب ۷: امنیت -->
        <div id="tab-security" class="tab-view">
            <div class="card">
                <div class="card-header"><h2 class="card-title">🔐 تغییر اطلاعات ورود به پنل ادمین</h2></div>
                <form method="POST" action="/admin/update_admin_creds" style="max-width: 480px;">
                    <div class="form-group">
                        <label>نام کاربری ادمین:</label>
                        <input type="text" name="new_username" value="{{ admin_username }}" required>
                    </div>
                    <div class="form-group">
                        <label>رمز عبور جدید:</label>
                        <input type="password" name="new_password" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary">بروزرسانی مشخصات ورود</button>
                </form>
            </div>
        </div>
    </div>

    <script>
        function showTab(id) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
            
            event.currentTarget.classList.add('active');
            document.getElementById('tab-' + id).classList.add('active');
        }
    </script>
</body>
</html>
"""

# ----------------- روت‌های وب پنل -----------------
@admin_app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    admin_user = get_setting("admin_user", config.ADMIN_USERNAME)
    admin_pass = get_setting("admin_pass", config.ADMIN_PASSWORD)

    if request.method == 'POST':
        u = request.form.get('username')
        p = request.form.get('password')
        if u == admin_user and p == admin_pass:
            session['logged_in'] = True
            return redirect('/admin')
        error = "نام کاربری یا رمز عبور نادرست است!"
    return render_template_string(HTML_LOGIN, error=error)

@admin_app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect('/login')

@admin_app.route('/')
def root():
    return redirect('/admin')

@admin_app.route('/admin')
def admin_dashboard():
    if not session.get('logged_in'):
        return redirect('/login')

    msg = request.args.get('msg')
    chat_id_param = request.args.get('chat_id')

    with get_db() as db:
        chats = db.query(Chat).order_by(Chat.updated_at.desc()).all()
        users = db.query(User).order_by(User.last_seen.desc()).all()
        total_messages = db.query(Message).count()
        total_chats = len(chats)
        active_subs = db.query(User).filter_by(has_active_sub=True).count()

        active_chat = None
        active_messages = []
        if chat_id_param:
            try:
                cid = int(chat_id_param)
                active_chat = db.query(Chat).filter_by(chat_id=cid).first()
                if active_chat:
                    active_messages = db.query(Message).filter_by(chat_id=cid).order_by(Message.timestamp.asc()).all()
            except:
                pass
        elif chats:
            active_chat = chats[0]
            active_messages = db.query(Message).filter_by(chat_id=active_chat.chat_id).order_by(Message.timestamp.asc()).all()

    plans = get_plans()
    ai_enabled = get_setting("ai_enabled", "true").lower() in ("true", "1")
    ai_api_key = get_setting("ai_api_key", config.AI_API_KEY)
    ai_system_prompt = get_setting("ai_system_prompt", ai_engine.get_system_prompt())

    bot_settings = {
        "welcome_text": get_setting("welcome_text", "سلام خوش آمدید"),
        "plans_header_text": get_setting("plans_header_text", "لیست پلن‌ها"),
        "card_number": get_setting("card_number", "6037-9975-1234-5678"),
        "card_holder": get_setting("card_holder", "مدیریت"),
        "bank_name": get_setting("bank_name", "بانک ملی")
    }

    stats = {
        "total_messages": total_messages,
        "total_chats": total_chats,
        "active_subs": active_subs,
        "ai_enabled": ai_enabled,
        "ai_model": config.AI_MODEL
    }

    return render_template_string(
        HTML_ADMIN,
        msg=msg,
        stats=stats,
        chats=chats,
        active_chat=active_chat,
        active_messages=active_messages,
        plans=plans,
        users=users,
        user_client_active=user_client.is_connected,
        ai_enabled=ai_enabled,
        ai_api_key=ai_api_key,
        ai_system_prompt=ai_system_prompt,
        bot_settings=bot_settings,
        admin_username=get_setting("admin_user", config.ADMIN_USERNAME),
        default_api_id=config.TELEGRAM_API_ID,
        default_api_hash=config.TELEGRAM_API_HASH
    )

# ----------------- روت‌های عملیاتی پنل -----------------
@admin_app.route('/admin/send_manual_message', methods=['POST'])
def send_manual():
    if not session.get('logged_in'):
        return redirect('/login')
    chat_id = int(request.form.get('chat_id'))
    text = request.form.get('message_text')
    send_as = request.form.get('send_as', 'bot')

    if send_as == "user_account" and user_client.is_connected:
        run_async(user_client.send_message(chat_id, text))
    else:
        try:
            bot.send_message(chat_id, text)
            message_manager.record_message(
                chat_id=chat_id,
                sender_type="bot",
                text=text,
                source="bot",
                status="sent"
            )
        except Exception as e:
            return redirect(f"/admin?chat_id={chat_id}&msg=خطا در ارسال پیام: {e}")

    return redirect(f"/admin?chat_id={chat_id}&msg=پیام دستی ارسال گردید.")

@admin_app.route('/admin/reply_with_ai/<int:chat_id>')
def reply_ai(chat_id):
    if not session.get('logged_in'):
        return redirect('/login')
    history = message_manager.get_chat_history(chat_id, limit=6)
    last_user_msg = history[-1].text if history else "سلام"
    ai_reply = ai_engine.generate_response(chat_id, last_user_msg, history[:-1])

    try:
        bot.send_message(chat_id, ai_reply)
        message_manager.record_message(
            chat_id=chat_id,
            sender_type="ai",
            text=ai_reply,
            source="bot",
            status="sent",
            is_ai_replied=True
        )
    except Exception as e:
        return redirect(f"/admin?chat_id={chat_id}&msg=خطا: {e}")

    return redirect(f"/admin?chat_id={chat_id}&msg=پاسخ هوش مصنوعی ارسال شد.")

@admin_app.route('/admin/toggle_chat_ai/<int:chat_id>')
def toggle_chat_ai(chat_id):
    if not session.get('logged_in'):
        return redirect('/login')
    with get_db() as db:
        c = db.query(Chat).filter_by(chat_id=chat_id).first()
        if c:
            c.is_ai_enabled = not c.is_ai_enabled
    return redirect(f"/admin?chat_id={chat_id}&msg=وضعیت هوش مصنوعی چت تغییر کرد.")

@admin_app.route('/admin/userbot/send_code', methods=['POST'])
def userbot_send_code():
    if not session.get('logged_in'):
        return redirect('/login')
    phone = request.form.get('phone')
    api_id = int(request.form.get('api_id'))
    api_hash = request.form.get('api_hash')

    res = run_async(user_client.request_code(phone, api_id, api_hash))
    return redirect(f"/admin?msg={res.get('message')}")

@admin_app.route('/admin/userbot/verify_code', methods=['POST'])
def userbot_verify_code():
    if not session.get('logged_in'):
        return redirect('/login')
    code = request.form.get('phone_code')
    pwd = request.form.get('password_2fa')

    res = run_async(user_client.verify_code(code, pwd))
    return redirect(f"/admin?msg={res.get('message')}")

@admin_app.route('/admin/update_ai_settings', methods=['POST'])
def update_ai():
    if not session.get('logged_in'):
        return redirect('/login')
    enabled = "true" if request.form.get('ai_enabled') else "false"
    set_setting("ai_enabled", enabled)
    set_setting("ai_api_key", request.form.get('ai_api_key', ''))
    set_setting("ai_system_prompt", request.form.get('ai_system_prompt', ''))
    return redirect("/admin?msg=تنظیمات هوش مصنوعی ذخیره گردید.")

@admin_app.route('/admin/add_plan', methods=['POST'])
def add_plan():
    if not session.get('logged_in'):
        return redirect('/login')
    plans = get_plans()
    plan_key = f"plan_{int(os.times().system * 1000)}"
    plans[plan_key] = {
        "name": request.form.get('name'),
        "price": int(request.form.get('price', 0)),
        "days": int(request.form.get('days', 30)),
        "pay_url": request.form.get('pay_url'),
        "desc": request.form.get('desc', '')
    }
    save_plans(plans)
    return redirect("/admin?msg=پلن جدید ذخیره شد.")

@admin_app.route('/admin/delete_plan/<key>')
def delete_plan(key):
    if not session.get('logged_in'):
        return redirect('/login')
    plans = get_plans()
    if key in plans:
        del plans[key]
        save_plans(plans)
    return redirect("/admin?msg=پلن حذف شد.")

@admin_app.route('/admin/update_bot_texts', methods=['POST'])
def update_bot_texts():
    if not session.get('logged_in'):
        return redirect('/login')
    for field in ['welcome_text', 'plans_header_text', 'card_number', 'card_holder', 'bank_name']:
        val = request.form.get(field)
        if val is not None:
            set_setting(field, val)
    return redirect("/admin?msg=متن‌ها و اطلاعات حساب بانکی بروز شدند.")

@admin_app.route('/admin/update_admin_creds', methods=['POST'])
def update_admin_creds():
    if not session.get('logged_in'):
        return redirect('/login')
    u = request.form.get('new_username')
    p = request.form.get('new_password')
    if u and p:
        set_setting("admin_user", u)
        set_setting("admin_pass", p)
    return redirect("/admin?msg=اطلاعات ورود ادمین با موفقیت تغییر یافت.")

@admin_app.route('/admin/revoke_user_sub/<int:uid>')
def revoke_user_sub(uid):
    if not session.get('logged_in'):
        return redirect('/login')
    with get_db() as db:
        user = db.query(User).filter_by(telegram_id=uid).first()
        if user:
            user.has_active_sub = False
    return redirect("/admin?msg=اشتراک کاربر باطل شد.")
