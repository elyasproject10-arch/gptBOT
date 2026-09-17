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
app.secret_key = "secure_secret_key_gptbot_admin_panel_v2"

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
    
    # ثبت در سفارشات
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
        
        # آپدیت وضعیت سفارش
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

# ----------------- قالب HTML پنل مدیریت پیشرفته -----------------
HTML_LOGIN = """
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8"><title>ورود به پنل مدیریت</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: system-ui, Tahoma, sans-serif; background: #090d16; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .box { background: #131b2e; padding: 35px; border-radius: 16px; width: 340px; border: 1px solid #22304d; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h2 { text-align: center; color: #38bdf8; margin-top: 0; font-size: 20px; }
        label { font-size: 13px; color: #94a3b8; display: block; margin-top: 15px; }
        input { width: 100%; padding: 12px; margin-top: 6px; background: #090d16; border: 1px solid #2b3b5c; color: #fff; border-radius: 8px; box-sizing: border-box; font-size: 14px; }
        input:focus { border-color: #38bdf8; outline: none; }
        button { width: 100%; padding: 12px; background: #0284c7; border: none; color: white; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold; margin-top: 25px; transition: 0.2s; }
        button:hover { background: #0369a1; }
        .err { color: #f87171; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 15px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="box">
        <h2>🔐 ورود به پنل مدیریت اشتراک</h2>
        {% if error %}<div class="err">{{ error }}</div>{% endif %}
        <form method="POST">
            <label>نام کاربری:</label>
            <input type="text" name="username" required autocomplete="off">
            <label>رمز عبور:</label>
            <input type="password" name="password" required>
            <button type="submit">ورود به پنل مدیریت</button>
        </form>
    </div>
</body>
</html>
"""

HTML_ADMIN = """
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8"><title>داشبورد مدیریت حرفه‌ای ربات اشتراک</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; }
        body { font-family: system-ui, Tahoma, sans-serif; background: #090d16; color: #f1f5f9; margin: 0; padding: 20px; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; background: #131b2e; padding: 18px 25px; border-radius: 14px; border: 1px solid #22304d; margin-bottom: 25px; }
        .header h1 { margin: 0; font-size: 20px; color: #38bdf8; display: flex; align-items: center; gap: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 25px; }
        .stat-card { background: #131b2e; border: 1px solid #22304d; padding: 20px; border-radius: 12px; }
        .stat-val { font-size: 24px; font-weight: bold; color: #38bdf8; margin-top: 5px; }
        .stat-lbl { font-size: 13px; color: #94a3b8; }
        
        .tabs { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid #22304d; padding-bottom: 10px; overflow-x: auto; }
        .tab-btn { background: transparent; border: none; color: #94a3b8; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; transition: 0.2s; white-space: nowrap; }
        .tab-btn.active { background: #0284c7; color: white; }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .card { background: #131b2e; border: 1px solid #22304d; border-radius: 14px; padding: 25px; margin-bottom: 25px; }
        .card h2 { margin-top: 0; font-size: 17px; color: #38bdf8; border-bottom: 1px solid #22304d; padding-bottom: 12px; }
        
        .form-row { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; }
        .form-group { flex: 1; min-width: 220px; }
        label { display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 6px; }
        input, textarea, select { width: 100%; padding: 10px 12px; background: #090d16; border: 1px solid #2b3b5c; border-radius: 8px; color: #fff; font-size: 14px; font-family: inherit; }
        textarea { resize: vertical; min-height: 80px; }
        input:focus, textarea:focus { border-color: #38bdf8; outline: none; }
        
        .btn { padding: 9px 18px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: white; transition: 0.2s; }
        .btn-primary { background: #0284c7; }
        .btn-primary:hover { background: #0369a1; }
        .btn-success { background: #10b981; }
        .btn-danger { background: #ef4444; }
        .btn-secondary { background: #475569; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: right; border-bottom: 1px solid #22304d; font-size: 13.5px; }
        th { background: #0d1424; color: #38bdf8; font-weight: 600; }
        tr:hover { background: rgba(56, 189, 248, 0.03); }
        .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; }
        .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .alert-box { background: rgba(56, 189, 248, 0.1); border: 1px solid #0284c7; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13.5px; color: #bae6fd; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 پنل مدیریت پیشرفته ربات فروش اشتراک</h1>
            <div>
                <span style="color: #94a3b8; font-size: 13px; margin-left: 15px;">مدیر: <b style="color:white;">{{ settings.admin_user }}</b></span>
                <a href="/logout" class="btn btn-secondary">خروج</a>
            </div>
        </div>

        {% if msg %}
        <div class="alert-box">✅ {{ msg }}</div>
        {% endif %}

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-lbl">👥 کل اشتراک‌های فعال</div>
                <div class="stat-val">{{ stats.active_subs }} کاربر</div>
            </div>
            <div class="stat-card">
                <div class="stat-lbl">📦 تعداد پلن‌های فعال</div>
                <div class="stat-val">{{ stats.total_plans }} پلن</div>
            </div>
            <div class="stat-card">
                <div class="stat-lbl">🛒 کل سفارشات ثبت‌شده</div>
                <div class="stat-val">{{ stats.total_orders }} سفارش</div>
            </div>
            <div class="stat-card">
                <div class="stat-lbl">💰 درآمد تخمینی تایید شده</div>
                <div class="stat-val">{{ "{:,}".format(stats.total_revenue) }} تومان</div>
            </div>
        </div>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('plans')">💎 پلن‌ها و محصولات</button>
            <button class="tab-btn" onclick="switchTab('texts')">✏️ ویرایش متن تعرفه‌ها و پیام‌های ربات</button>
            <button class="tab-btn" onclick="switchTab('orders')">🛍️ سفارشات و تراکنش‌ها</button>
            <button class="tab-btn" onclick="switchTab('subs')">👤 مدیریت کاربران و اشتراک‌ها</button>
            <button class="tab-btn" onclick="switchTab('settings')">⚙️ تنظیمات و تغییر رمز</button>
        </div>

        <!-- تب ۱: پلن‌ها -->
        <div id="tab-plans" class="tab-content active">
            <div class="card">
                <h2>➕ افزودن یا ویرایش پلن جدید</h2>
                <form method="POST" action="/admin/add_plan">
                    <div class="form-row">
                        <div class="form-group">
                            <label>نام محصول / پلن:</label>
                            <input type="text" name="name" placeholder="مثال: پلن الماس یک‌ماهه" required>
                        </div>
                        <div class="form-group">
                            <label>قیمت به تومان:</label>
                            <input type="number" name="price" placeholder="مثال: 150000" required>
                        </div>
                        <div class="form-group">
                            <label>مدت اعتبار (روز):</label>
                            <input type="number" name="days" placeholder="مثال: 30" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group" style="flex:2;">
                            <label>لینک پرداخت اختصاصی این محصول (درگاه پی‌پینگ):</label>
                            <input type="text" name="pay_url" placeholder="https://payping.ir/d/XXXXXX" required>
                        </div>
                        <div class="form-group" style="flex:2;">
                            <label>توضیحات کوتاه پلن (اختیاری):</label>
                            <input type="text" name="desc" placeholder="مثال: سرعت بالا، دو کاربره، بدون قطعی">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-success">➕ ذخیره و انتشار آنی در ربات</button>
                </form>
            </div>

            <div class="card">
                <h2>📦 لیست پلن‌های تعریف‌شده توسط ادمین</h2>
                <table>
                    <thead>
                        <tr>
                            <th>شناسه</th>
                            <th>نام پلن</th>
                            <th>قیمت (تومان)</th>
                            <th>مدت اعتبار</th>
                            <th>توضیحات</th>
                            <th>لینک پی‌پینگ</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for key, p in plans.items() %}
                        <tr>
                            <td><code>{{ key }}</code></td>
                            <td><b>{{ p.name }}</b></td>
                            <td>{{ "{:,}".format(p.price|int) }} تومان</td>
                            <td>{{ p.days }} روز</td>
                            <td>{{ p.desc or '-' }}</td>
                            <td><a href="{{ p.pay_url }}" target="_blank" style="color:#38bdf8;">مشاهده درگاه</a></td>
                            <td>
                                <a href="/admin/delete_plan/{{ key }}" class="btn btn-danger" onclick="return confirm('آیا از حذف این پلن مطمئن هستید؟')">حذف</a>
                            </td>
                        </tr>
                        {% else %}
                        <tr><td colspan="7" style="text-align:center; color:#94a3b8;">هنوز هیچ پلنی تعریف نشده است.</td></tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- تب ۲: متن‌ها و تعرفه‌ها -->
        <div id="tab-texts" class="tab-content">
            <div class="card">
                <h2>✏️ شخصی‌سازی متن‌های ربات تلگرام</h2>
                <form method="POST" action="/admin/update_texts">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label>📋 متن بالای لیست تعرفه‌ها (در دکمه «تعرفه‌ها و پلن‌ها»):</label>
                        <textarea name="plans_header_text" rows="3">{{ settings.plans_header_text }}</textarea>
                        <small style="color:#94a3b8;">این متن دقیقاً قبل از نمایش لیست قیمت‌ها به کاربر نمایش داده می‌شود.</small>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label>🌹 متن خوش‌آمدگویی استارت ربات (/start):</label>
                        <textarea name="welcome_text" rows="4">{{ settings.welcome_text }}</textarea>
                        <small style="color:#94a3b8;">می‌توانید از متغیر {name} برای قرارگیری نام کاربر استفاده کنید.</small>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label>📞 متن دکمه پشتیبانی:</label>
                        <textarea name="support_text" rows="3">{{ settings.support_text }}</textarea>
                        <small style="color:#94a3b8;">از متغیر {support_id} برای درج خودکار آیدی پشتیبانی استفاده می‌شود.</small>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>آیدی تلگرام پشتیبانی:</label>
                            <input type="text" name="support_id" value="{{ settings.support_id }}">
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary">💾 ذخیره تغییرات متن‌ها</button>
                </form>
            </div>
        </div>

        <!-- تب ۳: سفارشات -->
        <div id="tab-orders" class="tab-content">
            <div class="card">
                <h2>🛍️ تاریخچه تراکنش‌ها و سفارشات کاربران</h2>
                <table>
                    <thead>
                        <tr>
                            <th>شماره سفارش</th>
                            <th>مشتری</th>
                            <th>آیدی عددی</th>
                            <th>پلن انتخابی</th>
                            <th>مبلغ</th>
                            <th>تاریخ و زمان</th>
                            <th>وضعیت</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for ord in orders|reverse %}
                        <tr>
                            <td><code>{{ ord.id }}</code></td>
                            <td>{{ ord.name }} ({{ ord.username }})</td>
                            <td><code>{{ ord.user_id }}</code></td>
                            <td>{{ ord.plan_name }}</td>
                            <td>{{ "{:,}".format(ord.price|int) }} تومان</td>
                            <td>{{ ord.date }}</td>
                            <td>
                                {% if ord.status == 'approved' %}
                                <span class="badge badge-success">تایید و فعال شده</span>
                                {% elif ord.status == 'rejected' %}
                                <span class="badge badge-danger">رد شده</span>
                                {% else %}
                                <span class="badge badge-warning">در انتظار بررسی</span>
                                {% endif %}
                            </td>
                        </tr>
                        {% else %}
                        <tr><td colspan="7" style="text-align:center; color:#94a3b8;">هنوز سفارشی ثبت نشده است.</td></tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- تب ۴: اشتراک‌ها -->
        <div id="tab-subs" class="tab-content">
            <div class="card">
                <h2>➕ فعال‌سازی دستی اشتراک برای کاربر</h2>
                <form method="POST" action="/admin/manual_sub">
                    <div class="form-row">
                        <div class="form-group">
                            <label>آیدی عددی تلگرام کاربر:</label>
                            <input type="number" name="user_id" placeholder="مثال: 123456789" required>
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
                            <label>تعداد روز اعتبار:</label>
                            <input type="number" name="days" value="30" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-success">✅ فعال‌سازی اشتراک و ارسال پیام به کاربر</button>
                </form>
            </div>

            <div class="card">
                <h2>👥 مشترکین فعال</h2>
                <table>
                    <thead>
                        <tr>
                            <th>آیدی تلگرام</th>
                            <th>پلن فعال</th>
                            <th>تاریخ شروع</th>
                            <th>مدت</th>
                            <th>کد لایسنس</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {% for uid, s in subs.items() %}
                        <tr>
                            <td><code>{{ uid }}</code></td>
                            <td><b>{{ s.plan }}</b></td>
                            <td>{{ s.date }}</td>
                            <td>{{ s.days or 30 }} روز</td>
                            <td><code>{{ s.license_key }}</code></td>
                            <td>
                                <a href="/admin/revoke_sub/{{ uid }}" class="btn btn-danger" onclick="return confirm('آیا اشتراک این کاربر باطل شود؟')">ابطال اشتراک</a>
                            </td>
                        </tr>
                        {% else %}
                        <tr><td colspan="6" style="text-align:center; color:#94a3b8;">هیچ کاربری اشتراک فعال ندارد.</td></tr>
                        {% endfor %}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- تب ۵: تنظیمات -->
        <div id="tab-settings" class="tab-content">
            <div class="card">
                <h2>🔐 تغییر نام کاربری و رمز عبور پنل مدیریت</h2>
                <form method="POST" action="/admin/update_credentials">
                    <div class="form-row">
                        <div class="form-group">
                            <label>نام کاربری جدید:</label>
                            <input type="text" name="new_username" value="{{ settings.admin_user }}" required>
                        </div>
                        <div class="form-group">
                            <label>رمز عبور جدید:</label>
                            <input type="password" name="new_password" placeholder="رمز جدید را وارد کنید" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">تغییر اطلاعات ورود</button>
                </form>
            </div>
        </div>
    </div>

    <script>
        function switchTab(name) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById('tab-' + name).classList.add('active');
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
    return redirect('/admin?msg=پلن جدید با موفقیت اضافه شد.')

@app.route('/admin/delete_plan/<plan_id>')
def delete_plan(plan_id):
    if not session.get('logged_in'):
        return redirect('/login')
    plans = get_plans()
    if plan_id in plans:
        del plans[plan_id]
        save_json(PLANS_FILE, plans)
    return redirect('/admin?msg=پلن مورد نظر حذف گردید.')

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
    return redirect('/admin?msg=متن‌های ربات با موفقیت ذخیره و به‌روزرسانی شدند.')

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
    
    return redirect('/admin?msg=اشتراک دستی با موفقیت برای کاربر فعال گردید.')

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
    print("🚀 ربات تلگرام و پنل وب با موفقیت آنلاین شدند...")
    bot.infinity_polling(skip_pending=True)
