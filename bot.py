import telebot
from telebot import types
import json
import os
import time
import datetime
from threading import Thread
from flask import Flask, request, render_template_string, redirect, session, jsonify

# ----------------- تنظیمات پایه -----------------
BOT_TOKEN = "8974112756:AAE0UG5utdloIPcRkFu-fxp_fISMQfK8p_A"
ADMIN_CHAT_ID = 5490508090
PORT = 8080

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "subscribers.json")
PLANS_FILE = os.path.join(BASE_DIR, "plans.json")
SETTINGS_FILE = os.path.join(BASE_DIR, "settings.json")
ORDERS_FILE = os.path.join(BASE_DIR, "orders.json")

app = Flask(__name__)
app.secret_key = "secure_secret_key_gptbot_admin_panel_v3"

# ----------------- دیتابیس جیسون -----------------
def load_json(fn, default):
    if os.path.exists(fn):
        try:
            with open(fn, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return default
    return default

def save_json(fn, data):
    with open(fn, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

DEFAULT_SETTINGS = {
    "admin_user": "admin",
    "admin_pass": "asd123ASD@#",
    "support_id": "@AdminSupport",
    "welcome_text": "سلام {name} عزیز! خوش آمدید. 🌹\n\n⚡️ به ربات رسمی فروش اشتراک خوش آمدید.\nاز منوی زیر جهت مشاهده تعرفه‌ها یا خرید اشتراک استفاده کنید:",
    "plans_header_text": "📋 تعرفه‌های اشتراک فعال:\n\nجهت خرید هر یک از پلن‌ها، روی دکمه «💎 خرید اشتراک» کلیک کنید.",
    "support_text": "📞 جهت پشتیبانی، پیگیری سفارشات یا سوالات با آیدی زیر در ارتباط باشید:\n{support_id}",
    "card_number": "6037-9975-1234-5678",
    "card_holder": "مدیریت سرویس",
    "bank_name": "بانک ملی"
}

def get_settings():
    s = load_json(SETTINGS_FILE, {})
    changed = False
    for k, v in DEFAULT_SETTINGS.items():
        if k not in s:
            s[k] = v
            changed = True
    if changed:
        save_json(SETTINGS_FILE, s)
    return s

def get_plans():
    return load_json(PLANS_FILE, {})

def get_subs():
    return load_json(DATA_FILE, {})

def get_orders():
    return load_json(ORDERS_FILE, [])

bot = telebot.TeleBot(BOT_TOKEN)

# ----------------- منطق ربات تلگرام -----------------
def main_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add(types.KeyboardButton("💎 خرید اشتراک"), types.KeyboardButton("📋 تعرفه‌ها و پلن‌ها"))
    markup.add(types.KeyboardButton("👤 وضعیت اشتراک من"), types.KeyboardButton("📞 پشتیبانی"))
    return markup

@bot.message_handler(commands=['start'])
def send_welcome(message):
    settings = get_settings()
    name = message.from_user.first_name or "کاربر گرامی"
    text = settings.get("welcome_text", DEFAULT_SETTINGS["welcome_text"]).replace("{name}", name)
    bot.send_message(message.chat.id, text, reply_markup=main_keyboard())

@bot.message_handler(func=lambda msg: msg.text == "📋 تعرفه‌ها و پلن‌ها")
def show_plans(message):
    settings = get_settings()
    plans = get_plans()
    header_text = settings.get("plans_header_text", DEFAULT_SETTINGS["plans_header_text"])
    
    if not plans:
        bot.send_message(message.chat.id, "⚠️ در حال حاضر هیچ پلنی فعال نیست. لطفاً بعداً مراجعه کنید.")
        return
    
    text = f"{header_text}\n\n"
    for key, p in plans.items():
        price_fmt = f"{int(p['price']):,}"
        text += f"🔹 **{p['name']}**\n   💰 قیمت: {price_fmt} تومان\n   ⏳ مدت اعتبار: {p['days']} روز\n"
        if p.get('desc'):
            text += f"   📝 توضیحات: {p['desc']}\n"
        text += "\n"
    
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("💎 خرید آنلاین هرکدام از پلن‌ها", callback_data="open_buy_menu"))
    bot.send_message(message.chat.id, text, parse_mode="Markdown", reply_markup=markup)

@bot.message_handler(func=lambda msg: msg.text == "📞 پشتیبانی")
def support(message):
    settings = get_settings()
    support_id = settings.get("support_id", "@AdminSupport")
    text = settings.get("support_text", DEFAULT_SETTINGS["support_text"]).replace("{support_id}", support_id)
    bot.send_message(message.chat.id, text)

@bot.message_handler(func=lambda msg: msg.text == "👤 وضعیت اشتراک من")
def my_sub(message):
    subs = get_subs()
    uid = str(message.chat.id)
    if uid in subs and subs[uid].get("active"):
        s = subs[uid]
        bot.send_message(
            message.chat.id,
            f"✅ **اشتراک شما فعال است!**\n\n"
            f"🔹 نام پلن: {s.get('plan')}\n"
            f"📅 تاریخ ثبت: {s.get('date')}\n"
            f"⏳ روزهای اعتبار: {s.get('days', 30)} روز\n"
            f"🔑 کد لایسنس شما:\n`{s.get('license_key')}`",
            parse_mode="Markdown"
        )
    else:
        bot.send_message(message.chat.id, "❌ شما در حال حاضر اشتراک فعالی ندارید.\nبرای خرید اشتراک از دکمه «💎 خرید اشتراک» استفاده کنید.")

@bot.message_handler(func=lambda msg: msg.text == "💎 خرید اشتراک")
def buy_subscription(message):
    plans = get_plans()
    if not plans:
        bot.send_message(message.chat.id, "⚠️ در حال حاضر هیچ پلنی فعال نیست. با پشتیبانی در تماس باشید.")
        return
    markup = types.InlineKeyboardMarkup(row_width=1)
    for key, p in plans.items():
        btn = types.InlineKeyboardButton(f"🛒 {p['name']} - {int(p['price']):,} تومان", callback_data=f"select_{key}")
        markup.add(btn)
    bot.send_message(message.chat.id, "👇 لطفاً پلن مورد نظر خود را جهت خرید انتخاب فرمایید:", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: call.data == "open_buy_menu")
def cb_open_buy(call):
    buy_subscription(call.message)

@bot.callback_query_handler(func=lambda call: call.data.startswith("select_"))
def process_product_selection(call):
    plan_key = call.data.replace("select_", "")
    plans = get_plans()
    plan = plans.get(plan_key)
    if not plan:
        bot.answer_callback_query(call.id, "پلن یافت نشد!", show_alert=True)
        return
    
    markup = types.InlineKeyboardMarkup(row_width=1)
    btn_pay = types.InlineKeyboardButton(f"💳 رفتن به درگاه پرداخت ({int(plan['price']):,} تومان)", url=plan['pay_url'])
    btn_verify = types.InlineKeyboardButton("✅ پرداخت کردم (ارسال رسید یا کد پیگیری)", callback_data=f"done_{plan_key}")
    markup.add(btn_pay, btn_verify)
    
    text = (
        f"💎 **پیش‌فاکتور خرید اشتراک:**\n\n"
        f"📦 پلن: **{plan['name']}**\n"
        f"💰 مبلغ قابل پرداخت: **{int(plan['price']):,} تومان**\n"
        f"⏳ مدت زمان اعتبار: {plan['days']} روز\n"
    )
    if plan.get('desc'):
        text += f"📝 توضیحات: {plan['desc']}\n"
    text += "\n🔗 جهت پرداخت آنلاین روی دکمه درگاه پرداخت زیر کلیک کنید.\nپس از اتمام تراکنش، دکمه «پرداخت کردم» را بزنید."
    bot.send_message(call.message.chat.id, text, reply_markup=markup, parse_mode="Markdown")

@bot.callback_query_handler(func=lambda call: call.data.startswith("done_"))
def ask_payment_ref(call):
    plan_key = call.data.replace("done_", "")
    plans = get_plans()
    plan = plans.get(plan_key, {"name": "محصول اشتراک", "price": 0, "days": 30})
    user_id = call.from_user.id
    name = call.from_user.first_name or "کاربر"
    username = f"@{call.from_user.username}" if call.from_user.username else "بدون نام‌کاربری"
    
    orders = get_orders()
    order_item = {
        "id": f"ORD-{int(time.time())}",
        "user_id": str(user_id),
        "name": name,
        "username": username,
        "plan_key": plan_key,
        "plan_name": plan['name'],
        "price": int(plan.get('price', 0)),
        "days": int(plan.get('days', 30)),
        "date": str(datetime.datetime.now().strftime("%Y-%m-%d %H:%M")),
        "status": "pending"
    }
    orders.append(order_item)
    save_json(ORDERS_FILE, orders)

    bot.send_message(
        call.message.chat.id,
        "🙏 سفارش شما ثبت شد! لطفاً **کد پیگیری، شماره تراکنش یا عکس فیش واریزی** خود را در پاسخ به این پیام ارسال نمایید."
    )
    
    admin_markup = types.InlineKeyboardMarkup(row_width=2)
    btn_ok = types.InlineKeyboardButton("✅ تایید و فعالسازی", callback_data=f"adm_ok_{user_id}_{plan_key}")
    btn_no = types.InlineKeyboardButton("❌ رد سفارش", callback_data=f"adm_no_{user_id}")
    admin_markup.add(btn_ok, btn_no)
    
    bot.send_message(
        ADMIN_CHAT_ID,
        f"🔔 **سفارش جدید پرداخت!**\n\n"
        f"👤 مشتری: {name} ({username})\n"
        f"🆔 آیدی عددی: `{user_id}`\n"
        f"📦 پلن: {plan['name']}\n"
        f"💰 مبلغ: {int(plan.get('price', 0)):,} تومان\n"
        f"⏳ مدت: {plan.get('days', 30)} روز",
        reply_markup=admin_markup,
        parse_mode="Markdown"
    )

@bot.callback_query_handler(func=lambda call: call.data.startswith("adm_ok_") or call.data.startswith("adm_no_"))
def admin_approval(call):
    if call.from_user.id != ADMIN_CHAT_ID:
        bot.answer_callback_query(call.id, "شما دسترسی مدیریت ندارید!")
        return
    parts = call.data.split("_")
    action = parts[1]
    target_id = parts[2]
    
    if action == "ok":
        plan_key = parts[3]
        plans = get_plans()
        plan = plans.get(plan_key, {"name": "اشتراک ویژه", "days": 30})
        lic = f"LIC-{int(time.time())}-{str(target_id)[-4:]}"
        subs = get_subs()
        subs[str(target_id)] = {
            "active": True,
            "plan": plan['name'],
            "date": str(datetime.date.today()),
            "days": plan.get('days', 30),
            "license_key": lic
        }
        save_json(DATA_FILE, subs)
        
        orders = get_orders()
        for ord in orders:
            if ord.get("user_id") == str(target_id) and ord.get("status") == "pending":
                ord["status"] = "approved"
        save_json(ORDERS_FILE, orders)

        try:
            bot.send_message(
                int(target_id),
                f"🎉 **پرداخت شما تایید و اشتراک فعال گردید!**\n\n"
                f"🔹 پلن: {plan['name']}\n"
                f"⏳ مدت: {plan.get('days', 30)} روز\n"
                f"🔑 کد لایسنس اختصاصی شما:\n`{lic}`\n\n"
                "با تشکر از اعتماد شما 🌹",
                parse_mode="Markdown"
            )
        except:
            pass
        bot.edit_message_text(f"✅ اشتراک کاربر `{target_id}` با موفقیت تایید و فعال شد.", chat_id=call.message.chat.id, message_id=call.message.message_id)
    else:
        orders = get_orders()
        for ord in orders:
            if ord.get("user_id") == str(target_id) and ord.get("status") == "pending":
                ord["status"] = "rejected"
        save_json(ORDERS_FILE, orders)

        try:
            bot.send_message(
                int(target_id),
                "⚠️ متاسفانه سفارش شما توسط مدیریت تایید نشد. در صورت کسر وجه با پشتیبانی در ارتباط باشید."
            )
        except:
            pass
        bot.edit_message_text(f"❌ سفارش کاربر `{target_id}` رد شد.", chat_id=call.message.chat.id, message_id=call.message.message_id)

@bot.message_handler(content_types=['photo', 'text'])
def forward_receipt(message):
    if message.chat.id == ADMIN_CHAT_ID:
        return
    bot.reply_to(message, "✅ پیام یا فیش شما دریافت شد و جهت بررسی برای مدیریت ارسال گردید.")
    bot.forward_message(ADMIN_CHAT_ID, message.chat.id, message.message_id)

# ----------------- قالب HTML پنل با فونت زیبا و دیزاین مدرن -----------------
HTML_LOGIN = """
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>ورود به پنل مدیریت</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif; }
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
            background: rgba(18, 26, 44, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 20px;
            padding: 40px 32px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
        }
        .logo-badge {
            width: 54px;
            height: 54px;
            background: linear-gradient(135deg, #0284c7, #0ea5e9);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            margin: 0 auto 16px auto;
            box-shadow: 0 8px 20px rgba(14, 165, 233, 0.35);
        }
        h2 { text-align: center; margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #f8fafc; }
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
            transition: all 0.2s ease;
        }
        input:focus {
            border-color: #38bdf8;
            background: #0d1527;
            outline: none;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }
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
            transition: all 0.2s;
            margin-top: 10px;
            box-shadow: 0 6px 15px rgba(2, 132, 199, 0.3);
        }
        button:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px rgba(2, 132, 199, 0.4);
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
        <h2>ورود به پنل مدیریت</h2>
        <p class="subtitle">سیستم مدیریت اشتراک و ربات تلگرام</p>
        {% if error %}<div class="err">{{ error }}</div>{% endif %}
        <form method="POST">
            <div class="form-group">
                <label>نام کاربری:</label>
                <input type="text" name="username" required autocomplete="off" placeholder="نام کاربری ادمین">
            </div>
            <div class="form-group">
                <label>رمز عبور:</label>
                <input type="password" name="password" required placeholder="••••••••">
            </div>
            <button type="submit">ورود به پنل داشبورد</button>
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
    <title>داشبورد مدیریت اشتراک‌ها</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif; }
        body {
            background-color: #070b13;
            color: #f1f5f9;
            margin: 0;
            padding: 24px;
            min-height: 100vh;
        }
        .container { max-width: 1280px; margin: 0 auto; }
        
        /* Navbar */
        .topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            border: 1px solid #1e293b;
            padding: 16px 24px;
            border-radius: 16px;
            margin-bottom: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .brand-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #0284c7, #38bdf8);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        .brand-title { margin: 0; font-size: 18px; font-weight: 700; color: #f8fafc; }
        .brand-sub { margin: 0; font-size: 12px; color: #94a3b8; }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .user-badge {
            background: #1e293b;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            color: #38bdf8;
            border: 1px solid #334155;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .stat-card {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 16px;
            padding: 20px;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); border-color: #38bdf8; }
        .stat-icon {
            position: absolute;
            left: 18px;
            top: 20px;
            font-size: 28px;
            opacity: 0.7;
        }
        .stat-title { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .stat-number { font-size: 26px; font-weight: 800; color: #f8fafc; margin-top: 6px; }
        .stat-desc { font-size: 11px; color: #38bdf8; margin-top: 4px; }
        
        /* Navigation Tabs */
        .nav-tabs {
            display: flex;
            gap: 8px;
            background: #0f172a;
            padding: 6px;
            border-radius: 14px;
            border: 1px solid #1e293b;
            margin-bottom: 24px;
            overflow-x: auto;
        }
        .tab-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .tab-btn:hover { color: #f8fafc; background: rgba(255,255,255,0.03); }
        .tab-btn.active {
            background: #0284c7;
            color: #fff;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
        }
        
        .tab-view { display: none; }
        .tab-view.active { display: block; }
        
        /* Card & Content */
        .card {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 18px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .card-title { margin: 0; font-size: 16px; font-weight: 700; color: #f8fafc; display: flex; align-items: center; gap: 8px; }
        
        /* Forms */
        .grid-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 13px; font-weight: 500; color: #cbd5e1; margin-bottom: 6px; }
        input, select, textarea {
            width: 100%;
            padding: 11px 14px;
            background: #090d16;
            border: 1px solid #1e293b;
            border-radius: 10px;
            color: #f8fafc;
            font-size: 13.5px;
            transition: all 0.2s;
        }
        textarea { resize: vertical; min-height: 90px; line-height: 1.5; }
        input:focus, select:focus, textarea:focus {
            border-color: #0284c7;
            background: #0b1120;
            outline: none;
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }
        
        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 13.5px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            text-decoration: none;
            transition: all 0.2s;
        }
        .btn-primary { background: #0284c7; color: white; }
        .btn-primary:hover { background: #0369a1; }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; }
        .btn-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .btn-danger:hover { background: #ef4444; color: white; }
        .btn-secondary { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; }
        .btn-secondary:hover { background: #334155; color: white; }
        
        /* Tables */
        .table-responsive { overflow-x: auto; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13.5px; }
        th {
            background: #1e293b;
            color: #cbd5e1;
            padding: 12px 16px;
            text-align: right;
            font-weight: 600;
            border-top: 1px solid #334155;
            border-bottom: 1px solid #334155;
        }
        th:first-child { border-top-right-radius: 10px; border-bottom-right-radius: 10px; }
        th:last-child { border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
        td {
            padding: 14px 16px;
            border-bottom: 1px solid #1e293b;
            color: #e2e8f0;
            vertical-align: middle;
        }
        tr:hover td { background: rgba(255,255,255,0.02); }
        
        /* Badges */
        .badge {
            padding: 5px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }
        .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        
        .alert-box {
            background: rgba(14, 165, 233, 0.1);
            border: 1px solid rgba(14, 165, 233, 0.3);
            color: #38bdf8;
            padding: 14px 18px;
            border-radius: 12px;
            font-size: 13.5px;
            font-weight: 500;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .code-box {
            background: #090d16;
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid #1e293b;
            font-family: monospace;
            color: #38bdf8;
            font-size: 12.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- هدر بالای صفحه -->
        <div class="topbar">
            <div class="brand">
                <div class="brand-icon">💎</div>
                <div>
                    <h1 class="brand-title">پنل مدیریت اشتراک و ربات تلگرام</h1>
                    <p class="brand-sub">مدیریت آنی پلن‌ها، متن تعرفه‌ها، اشتراک‌ها و تراکنش‌ها</p>
                </div>
            </div>
            <div class="user-info">
                <div class="user-badge">👤 مدیر سیستم: <b>{{ settings.admin_user }}</b></div>
                <a href="/logout" class="btn btn-secondary">خروج</a>
            </div>
        </div>

        {% if msg %}
        <div class="alert-box">✨ {{ msg }}</div>
        {% endif %}

        <!-- کارت‌های آمار و اطلاعات -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-title">مشترکین فعال</div>
                <div class="stat-number">{{ stats.active_subs }}</div>
                <div class="stat-desc">دارای لایسنس معتبر</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-title">پلن‌های فعال در ربات</div>
                <div class="stat-number">{{ stats.total_plans }}</div>
                <div class="stat-desc">آماده سفارش کاربران</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🛍️</div>
                <div class="stat-title">کل سفارشات ثبت‌شده</div>
                <div class="stat-number">{{ stats.total_orders }}</div>
                <div class="stat-desc">تراکنش‌های ورودی</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-title">مجموع فروش تایید شده</div>
                <div class="stat-number">{{ "{:,}".format(stats.total_revenue) }}</div>
                <div class="stat-desc">تومان</div>
            </div>
        </div>

        <!-- تب‌های پیمایش -->
        <div class="nav-tabs">
            <button class="tab-btn active" onclick="showTab('plans')">📦 مدیریت پلن‌ها</button>
            <button class="tab-btn" onclick="showTab('texts')">✏️ ویرایش متن تعرفه‌ها و پیام‌های ربات</button>
            <button class="tab-btn" onclick="showTab('orders')">🛍️ لیست سفارشات</button>
            <button class="tab-btn" onclick="showTab('subs')">👥 مدیریت مشترکین و لایسنس</button>
            <button class="tab-btn" onclick="showTab('settings')">⚙️ تغییر نام کاربری و رمز</button>
        </div>

        <!-- تب ۱: پلن‌ها -->
        <div id="tab-plans" class="tab-view active">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">➕ ایجاد پلن یا محصول جدید</h2>
                </div>
                <form method="POST" action="/admin/add_plan">
                    <div class="grid-form">
                        <div class="form-group">
                            <label>نام پلن / محصول:</label>
                            <input type="text" name="name" placeholder="مثال: پلن طلایی VIP (۳ ماهه)" required>
                        </div>
                        <div class="form-group">
                            <label>قیمت محصول (تومان):</label>
                            <input type="number" name="price" placeholder="مثال: 150000" required>
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
                            <label>توضیحات کوتاه (اختیاری):</label>
                            <input type="text" name="desc" placeholder="مثال: بدون محدودیت، تحویل آنی">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-success">➕ ذخیره و نمایش در ربات تلگرام</button>
                </form>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">📋 پلن‌های فعال موجود در ربات</h2>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>نام پلن</th>
                                <th>قیمت</th>
                                <th>مدت اعتبار</th>
                                <th>توضیحات</th>
                                <th>لینک درگاه پی‌پینگ</th>
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
                                <td><a href="{{ p.pay_url }}" target="_blank" style="color:#0ea5e9; font-weight: 500; text-decoration: none;">مشاهده صفحه پرداخت ↗</a></td>
                                <td>
                                    <a href="/admin/delete_plan/{{ key }}" class="btn btn-danger" style="padding: 6px 14px; font-size: 12px;" onclick="return confirm('آیا مطمئن هستید که این پلن حذف شود؟')">حذف پلن</a>
                                </td>
                            </tr>
                            {% else %}
                            <tr>
                                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">هیچ پلنی هنوز ثبت نشده است. از فرم بالا اولین پلن خود را بسازید.</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- تب ۲: شخصی‌سازی متن‌ها -->
        <div id="tab-texts" class="tab-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">✏️ ویرایش آنلاین متن‌های ارسالی توسط ربات تلگرام</h2>
                </div>
                <form method="POST" action="/admin/update_texts">
                    <div class="form-group">
                        <label>📋 متن تیتر بالای لیست تعرفه‌ها (دکمه «تعرفه‌ها و پلن‌ها»):</label>
                        <textarea name="plans_header_text">{{ settings.plans_header_text }}</textarea>
                        <small style="color: #94a3b8; font-size: 12px; display: block; margin-top: 4px;">این متن در تلگرام دقیقاً بالای قیمت پلن‌ها برای مشتری نمایش داده می‌شود.</small>
                    </div>

                    <div class="form-group">
                        <label>🌹 متن پیام خوش‌آمدگویی استارت ربات (/start):</label>
                        <textarea name="welcome_text" style="min-height: 110px;">{{ settings.welcome_text }}</textarea>
                        <small style="color: #94a3b8; font-size: 12px; display: block; margin-top: 4px;">از {name} برای قرارگیری نام کاربر استفاده می‌شود.</small>
                    </div>

                    <div class="form-group">
                        <label>📞 متن دکمه پشتیبانی:</label>
                        <textarea name="support_text">{{ settings.support_text }}</textarea>
                        <small style="color: #94a3b8; font-size: 12px; display: block; margin-top: 4px;">از {support_id} برای جایگذاری آیدی پشتیبانی استفاده می‌شود.</small>
                    </div>

                    <div class="form-group" style="max-width: 320px;">
                        <label>آیدی تلگرام پشتیبانی:</label>
                        <input type="text" name="support_id" value="{{ settings.support_id }}">
                    </div>

                    <button type="submit" class="btn btn-primary">💾 ذخیره تغییرات متن‌ها</button>
                </form>
            </div>
        </div>

        <!-- تب ۳: سفارشات -->
        <div id="tab-orders" class="tab-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🛍️ سوابق خرید و پرداخت‌های کاربران</h2>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>کد پیگیری</th>
                                <th>نام مشتری</th>
                                <th>آیدی عددی</th>
                                <th>پلن درخواستی</th>
                                <th>مبلغ</th>
                                <th>تاریخ سفارش</th>
                                <th>وضعیت سفارش</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for ord in orders|reverse %}
                            <tr>
                                <td><span class="code-box">{{ ord.id }}</span></td>
                                <td><b>{{ ord.name }}</b> <span style="color:#94a3b8;font-size:12px;">({{ ord.username }})</span></td>
                                <td><span class="code-box">{{ ord.user_id }}</span></td>
                                <td>{{ ord.plan_name }}</td>
                                <td>{{ "{:,}".format(ord.price|int) }} تومان</td>
                                <td>{{ ord.date }}</td>
                                <td>
                                    {% if ord.status == 'approved' %}
                                    <span class="badge badge-success">✅ تایید و فعال</span>
                                    {% elif ord.status == 'rejected' %}
                                    <span class="badge badge-danger">❌ رد شده</span>
                                    {% else %}
                                    <span class="badge badge-warning">⏳ در انتظار فیش</span>
                                    {% endif %}
                                </td>
                            </tr>
                            {% else %}
                            <tr>
                                <td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">هیچ سفارشی هنوز ثبت نشده است.</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- تب ۴: اشتراک‌ها -->
        <div id="tab-subs" class="tab-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">➕ فعال‌سازی دستی اشتراک بدون پرداخت</h2>
                </div>
                <form method="POST" action="/admin/manual_sub">
                    <div class="grid-form">
                        <div class="form-group">
                            <label>آیدی عددی تلگرام مشتری:</label>
                            <input type="number" name="user_id" placeholder="مثال: 5490508090" required>
                        </div>
                        <div class="form-group">
                            <label>انتخاب پلن:</label>
                            <select name="plan_name" required>
                                {% for key, p in plans.items() %}
                                <option value="{{ p.name }}">{{ p.name }} ({{ p.days }} روز)</option>
                                {% endfor %}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>مدت اعتبار اشتراک (روز):</label>
                            <input type="number" name="days" value="30" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-success">✅ فعال‌سازی اشتراک و ارسال پیام لایسنس به کاربر</button>
                </form>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">👥 لیست مشترکین فعال</h2>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>آیدی تلگرام</th>
                                <th>پلن فعال</th>
                                <th>تاریخ شروع</th>
                                <th>مدت اعتبار</th>
                                <th>کد لایسنس</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for uid, s in subs.items() %}
                            <tr>
                                <td><span class="code-box">{{ uid }}</span></td>
                                <td><b style="color:#38bdf8;">{{ s.plan }}</b></td>
                                <td>{{ s.date }}</td>
                                <td>{{ s.days or 30 }} روز</td>
                                <td><span class="code-box">{{ s.license_key }}</span></td>
                                <td>
                                    <a href="/admin/revoke_sub/{{ uid }}" class="btn btn-danger" style="padding: 6px 14px; font-size: 12px;" onclick="return confirm('آیا اشتراک این کاربر باطل شود؟')">ابطال اشتراک</a>
                                </td>
                            </tr>
                            {% else %}
                            <tr>
                                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">هیچ کاربری در حال حاضر اشتراک فعال ندارد.</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- تب ۵: تنظیمات -->
        <div id="tab-settings" class="tab-view">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🔐 تغییر اطلاعات ورود به پنل ادمین</h2>
                </div>
                <form method="POST" action="/admin/update_credentials" style="max-width: 480px;">
                    <div class="form-group">
                        <label>نام کاربری جدید پنل:</label>
                        <input type="text" name="new_username" value="{{ settings.admin_user }}" required>
                    </div>
                    <div class="form-group">
                        <label>رمز عبور جدید:</label>
                        <input type="password" name="new_password" placeholder="رمز عبور قوی وارد نمایید" required>
                    </div>
                    <button type="submit" class="btn btn-primary">تغییر نام کاربری و رمز</button>
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

# ----------------- روت‌های تحت وب -----------------
@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    settings = get_settings()
    if request.method == 'POST':
        user = request.form.get('username')
        pwd = request.form.get('password')
        if user == settings.get('admin_user') and pwd == settings.get('admin_pass'):
            session['logged_in'] = True
            return redirect('/admin')
        else:
            error = "نام کاربری یا رمز عبور اشتباه است!"
    return render_template_string(HTML_LOGIN, error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect('/login')

@app.route('/admin')
def admin_page():
    if not session.get('logged_in'):
        return redirect('/login')
    plans = get_plans()
    subs = get_subs()
    orders = get_orders()
    settings = get_settings()
    msg = request.args.get('msg')
    
    total_revenue = sum(ord.get('price', 0) for ord in orders if ord.get('status') == 'approved')
    stats = {
        "active_subs": len(subs),
        "total_plans": len(plans),
        "total_orders": len(orders),
        "total_revenue": total_revenue
    }
    
    return render_template_string(HTML_ADMIN, plans=plans, subs=subs, orders=orders, settings=settings, stats=stats, msg=msg)

@app.route('/admin/add_plan', methods=['POST'])
def add_plan():
    if not session.get('logged_in'):
        return redirect('/login')
    plans = get_plans()
    new_id = f"plan_{int(time.time())}"
    plans[new_id] = {
        "name": request.form.get('name'),
        "price": int(request.form.get('price')),
        "days": int(request.form.get('days')),
        "pay_url": request.form.get('pay_url'),
        "desc": request.form.get('desc', '')
    }
    save_json(PLANS_FILE, plans)
    return redirect('/admin?msg=پلن جدید با موفقیت اضافه و در ربات منتشر گردید.')

@app.route('/admin/delete_plan/<plan_id>')
def delete_plan(plan_id):
    if not session.get('logged_in'):
        return redirect('/login')
    plans = get_plans()
    if plan_id in plans:
        del plans[plan_id]
        save_json(PLANS_FILE, plans)
    return redirect('/admin?msg=پلن با موفقیت حذف گردید.')

@app.route('/admin/update_texts', methods=['POST'])
def update_texts():
    if not session.get('logged_in'):
        return redirect('/login')
    settings = get_settings()
    settings['plans_header_text'] = request.form.get('plans_header_text')
    settings['welcome_text'] = request.form.get('welcome_text')
    settings['support_text'] = request.form.get('support_text')
    settings['support_id'] = request.form.get('support_id')
    save_json(SETTINGS_FILE, settings)
    return redirect('/admin?msg=متن‌های تعرفه‌ها و پیام‌های ربات با موفقیت ذخیره شدند.')

@app.route('/admin/manual_sub', methods=['POST'])
def manual_sub():
    if not session.get('logged_in'):
        return redirect('/login')
    uid = request.form.get('user_id')
    plan_name = request.form.get('plan_name')
    days = int(request.form.get('days', 30))
    lic = f"LIC-{int(time.time())}-{str(uid)[-4:]}"
    
    subs = get_subs()
    subs[str(uid)] = {
        "active": True,
        "plan": plan_name,
        "date": str(datetime.date.today()),
        "days": days,
        "license_key": lic
    }
    save_json(DATA_FILE, subs)
    
    try:
        bot.send_message(
            int(uid),
            f"🎉 **اشتراک شما توسط مدیریت به صورت دستی فعال گردید!**\n\n"
            f"🔹 پلن: {plan_name}\n"
            f"⏳ مدت اعتبار: {days} روز\n"
            f"🔑 کد لایسنس شما:\n`{lic}`",
            parse_mode="Markdown"
        )
    except:
        pass
    
    return redirect('/admin?msg=اشتراک دستی با موفقیت فعال شد.')

@app.route('/admin/revoke_sub/<uid>')
def revoke_sub(uid):
    if not session.get('logged_in'):
        return redirect('/login')
    subs = get_subs()
    if str(uid) in subs:
        del subs[str(uid)]
        save_json(DATA_FILE, subs)
    return redirect('/admin?msg=اشتراک کاربر باطل شد.')

@app.route('/admin/update_credentials', methods=['POST'])
def update_credentials():
    if not session.get('logged_in'):
        return redirect('/login')
    settings = get_settings()
    settings['admin_user'] = request.form.get('new_username')
    settings['admin_pass'] = request.form.get('new_password')
    save_json(SETTINGS_FILE, settings)
    return redirect('/admin?msg=اطلاعات ورود به پنل با موفقیت تغییر یافت.')

def run_web():
    app.run(host='0.0.0.0', port=PORT)

if __name__ == '__main__':
    try:
        bot.remove_webhook()
    except:
        pass
    t = Thread(target=run_web)
    t.daemon = True
    t.start()
    print("🚀 ربات تلگرام و پنل وب مدرن با موفقیت آنلاین شدند...")
    bot.infinity_polling(skip_pending=True)
