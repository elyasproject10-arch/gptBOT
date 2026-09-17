import telebot
from telebot import types
import json
import os
import time
import datetime
from threading import Thread
from flask import Flask, request, render_template_string, redirect, session

# ----------------- تنظیمات -----------------
BOT_TOKEN = "8974112756:AAE0UG5utdloIPcRkFu-fxp_fISMQfK8p_A"
ADMIN_CHAT_ID = 5490508090
PORT = 8080

ADMIN_USER = "admin"
ADMIN_PASS = "asd123ASD@#"

app = Flask(__name__)
app.secret_key = "secure_secret_key_gptbot_admin_panel"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "subscribers.json")
PLANS_FILE = os.path.join(BASE_DIR, "plans.json")

bot = telebot.TeleBot(BOT_TOKEN)

# ----------------- دیتابیس -----------------
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

def get_plans():
    return load_json(PLANS_FILE, {})

# ----------------- تلگرام -----------------
def main_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add(types.KeyboardButton("💎 خرید اشتراک"), types.KeyboardButton("📋 تعرفه‌ها و پلن‌ها"))
    markup.add(types.KeyboardButton("👤 وضعیت اشتراک من"), types.KeyboardButton("📞 پشتیبانی"))
    return markup

@bot.message_handler(commands=['start'])
def send_welcome(message):
    name = message.from_user.first_name or "کاربر گرامی"
    welcome_text = (
        f"سلام {name} عزیز! خوش آمدید. 🌹\n\n"
        "⚡️ به سیستم هوشمند خرید اشتراک خوش آمدید.\n"
        "از دکمه‌های زیر جهت خرید یا بررسی پلن‌ها استفاده کنید:"
    )
    bot.send_message(message.chat.id, welcome_text, reply_markup=main_keyboard())

@bot.message_handler(func=lambda msg: msg.text == "📋 تعرفه‌ها و پلن‌ها")
def show_plans(message):
    plans = get_plans()
    if not plans:
        bot.send_message(message.chat.id, "⚠️ در حال حاضر هیچ پلنی توسط مدیریت تعریف نشده است.")
        return
    text = "📋 **پلن‌های فعال اشتراک:**\n\n"
    for key, p in plans.items():
        text += f"🔹 **{p['name']}**\n   💰 قیمت: {int(p['price']):,} تومان\n   ⏳ اعتبار: {p['days']} روز\n\n"
    text += "برای پرداخت و خرید آنلاین، دکمه «💎 خرید اشتراک» را لمس کنید."
    bot.send_message(message.chat.id, text, parse_mode="Markdown")

@bot.message_handler(func=lambda msg: msg.text == "👤 وضعیت اشتراک من")
def my_sub(message):
    subs = load_json(DATA_FILE, {})
    uid = str(message.chat.id)
    if uid in subs and subs[uid].get("active"):
        s = subs[uid]
        bot.send_message(
            message.chat.id,
            f"✅ **اشتراک شما فعال است!**\n\n"
            f"🔹 محصول: {s.get('plan')}\n"
            f"📅 تاریخ ثبت: {s.get('date')}\n"
            f"🔑 لایسنس شما:\n`{s.get('license_key')}`",
            parse_mode="Markdown"
        )
    else:
        bot.send_message(message.chat.id, "❌ شما در حال حاضر اشتراک فعالی ندارید.")

@bot.message_handler(func=lambda msg: msg.text == "📞 پشتیبانی")
def support(message):
    bot.send_message(message.chat.id, "جهت هرگونه راهنمایی با پشتیبانی در ارتباط باشید:\n@AdminSupport")

@bot.message_handler(func=lambda msg: msg.text == "💎 خرید اشتراک")
def buy_subscription(message):
    plans = get_plans()
    if not plans:
        bot.send_message(message.chat.id, "⚠️ در حال حاضر هیچ پلنی فعال نیست. لطفاً با پشتیبانی تماس بگیرید.")
        return
    markup = types.InlineKeyboardMarkup(row_width=1)
    for key, p in plans.items():
        btn = types.InlineKeyboardButton(f"🛒 {p['name']} - {int(p['price']):,} تومان", callback_data=f"select_{key}")
        markup.add(btn)
    bot.send_message(message.chat.id, "👇 لطفاً محصول مورد نظر خود را برای خرید انتخاب کنید:", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: call.data.startswith("select_"))
def process_product_selection(call):
    plan_key = call.data.replace("select_", "")
    plans = get_plans()
    plan = plans.get(plan_key)
    if not plan:
        bot.answer_callback_query(call.id, "این پلن موجود نیست!")
        return
    
    markup = types.InlineKeyboardMarkup(row_width=1)
    btn_pay = types.InlineKeyboardButton(f"💳 ورود به درگاه پرداخت ({int(plan['price']):,} تومان)", url=plan['pay_url'])
    btn_verify = types.InlineKeyboardButton("✅ پرداخت کردم (ثبت کد پیگیری)", callback_data=f"done_{plan_key}")
    markup.add(btn_pay, btn_verify)
    
    text = (
        f"💎 **پیش‌فاکتور خرید محصول:**\n\n"
        f"📦 نام محصول: **{plan['name']}**\n"
        f"💰 مبلغ قابل پرداخت: **{int(plan['price']):,} تومان**\n"
        f"⏳ مدت اعتبار: {plan['days']} روز\n\n"
        "🔗 روی دکمه ورود به درگاه زیر کلیک کنید. پس از اتمام پرداخت، دکمه «پرداخت کردم» را بزنید:"
    )
    bot.send_message(call.message.chat.id, text, reply_markup=markup, parse_mode="Markdown")

@bot.callback_query_handler(func=lambda call: call.data.startswith("done_"))
def ask_payment_ref(call):
    plan_key = call.data.replace("done_", "")
    plans = get_plans()
    plan = plans.get(plan_key, {"name": "محصول اشتراک", "price": 0})
    user_id = call.from_user.id
    name = call.from_user.first_name or "کاربر"
    username = f"@{call.from_user.username}" if call.from_user.username else "ندارد"
    
    bot.send_message(
        call.message.chat.id,
        "🙏 لطفاً شماره پیگیری، کد تراکنش پی‌پینگ یا عکس فیش واریزی خود را در پاسخ به این پیام ارسال کنید."
    )
    
    admin_markup = types.InlineKeyboardMarkup(row_width=2)
    btn_ok = types.InlineKeyboardButton("✅ تایید و فعالسازی", callback_data=f"adm_ok_{user_id}_{plan_key}")
    btn_no = types.InlineKeyboardButton("❌ رد", callback_data=f"adm_no_{user_id}")
    admin_markup.add(btn_ok, btn_no)
    
    bot.send_message(
        ADMIN_CHAT_ID,
        f"🔔 **ثبت سفارش پرداخت جدید!**\n\n"
        f"👤 مشتری: {name} ({username})\n"
        f"🆔 آیدی عددی: `{user_id}`\n"
        f"📦 محصول: {plan['name']}\n"
        f"💰 مبلغ: {int(plan.get('price', 0)):,} تومان",
        reply_markup=admin_markup,
        parse_mode="Markdown"
    )

@bot.callback_query_handler(func=lambda call: call.data.startswith("adm_ok_") or call.data.startswith("adm_no_"))
def admin_approval(call):
    if call.from_user.id != ADMIN_CHAT_ID:
        return
    parts = call.data.split("_")
    action = parts[1]
    target_id = parts[2]
    
    if action == "ok":
        plan_key = parts[3]
        plans = get_plans()
        plan = plans.get(plan_key, {"name": "اشتراک ویژه"})
        lic = f"LIC-{int(time.time())}-{target_id[-4:]}"
        subs = load_json(DATA_FILE, {})
        subs[str(target_id)] = {
            "active": True,
            "plan": plan['name'],
            "date": str(datetime.date.today()),
            "license_key": lic
        }
        save_json(DATA_FILE, subs)
        try:
            bot.send_message(
                int(target_id),
                f"🎉 **پرداخت شما تایید و اشتراک فعال گردید!**\n\n"
                f"🔹 محصول: {plan['name']}\n"
                f"🔑 کد لایسنس شما:\n`{lic}`",
                parse_mode="Markdown"
            )
        except:
            pass
        bot.edit_message_text(f"✅ اشتراک کاربر `{target_id}` با موفقیت فعال شد.", chat_id=call.message.chat.id, message_id=call.message.message_id)
    else:
        bot.edit_message_text(f"❌ سفارش کاربر `{target_id}` رد شد.", chat_id=call.message.chat.id, message_id=call.message.message_id)

@bot.message_handler(content_types=['photo', 'text'])
def forward_receipt(message):
    if message.chat.id == ADMIN_CHAT_ID:
        return
    bot.reply_to(message, "✅ پیام شما دریافت شد و برای مدیریت ارسال گردید.")
    bot.forward_message(ADMIN_CHAT_ID, message.chat.id, message.message_id)

# ----------------- پنل وب -----------------
HTML_LOGIN = """
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8"><title>ورود به پنل مدیریت</title>
    <style>
        body { font-family: Tahoma, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .box { background: #1e293b; padding: 35px; border-radius: 12px; width: 340px; border: 1px solid #334155; }
        h2 { text-align: center; color: #38bdf8; margin-top: 0; }
        input { width: 100%; padding: 12px; margin: 10px 0; background: #0f172a; border: 1px solid #475569; color: #fff; border-radius: 8px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #0284c7; border: none; color: white; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold; margin-top: 10px; }
        .err { color: #f87171; text-align: center; margin-bottom: 10px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="box">
        <h2>🔐 ورود به مدیریت</h2>
        {% if error %}<div class="err">{{ error }}</div>{% endif %}
        <form method="POST">
            <label>نام کاربری:</label>
            <input type="text" name="username" required>
            <label>رمز عبور:</label>
            <input type="password" name="password" required>
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
    <meta charset="UTF-8"><title>داشبورد مدیریت اشتراک‌ها</title>
    <style>
        body { font-family: Tahoma, sans-serif; background: #0b1329; color: #f8fafc; padding: 25px; margin: 0; }
        .header { display: flex; justify-content: space-between; align-items: center; background: #1e293b; padding: 15px 25px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 25px; }
        .card { background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid #334155; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; border-bottom: 1px solid #334155; text-align: right; }
        th { background: #0f172a; color: #38bdf8; }
        .btn { padding: 8px 16px; border-radius: 6px; text-decoration: none; color: white; cursor: pointer; border: none; font-size: 13px; font-weight: bold; display: inline-block; }
        .btn-add { background: #10b981; }
        .btn-del { background: #ef4444; }
        .btn-out { background: #64748b; }
        input { padding: 10px; background: #0f172a; border: 1px solid #475569; color: white; border-radius: 6px; margin-bottom: 10px; width: calc(50% - 15px); box-sizing: border-box; }
    </style>
</head>
<body>
    <div class="header">
        <h2 style="margin:0;color:#38bdf8;">📊 پنل مدیریت اشتراک و ربات تلگرام</h2>
        <div>
            <span>کاربر مدیر: <b>admin</b></span> | 
            <a href="/logout" class="btn btn-out">خروج</a>
        </div>
    </div>

    <div class="card">
        <h3>➕ تعریف پلن یا محصول جدید (توسط خود ادمین)</h3>
        <p style="color:#94a3b8;font-size:13px;">هر محصولی که اینجا اضافه کنید بلافاصله به عنوان دکمه خرید در ربات تلگرام ظاهر می‌شود.</p>
        <form method="POST" action="/admin/add_plan">
            <input type="text" name="name" placeholder="نام پلن (مثال: پلن VIP یک‌ماهه)" required>
            <input type="number" name="price" placeholder="قیمت به تومان (مثال: 150000)" required>
            <input type="number" name="days" placeholder="مدت اعتبار به روز (مثال: 30)" required>
            <input type="text" name="pay_url" placeholder="لینک اختصاصی پی‌پینگ این محصول (https://payping.ir/d/...)" required>
            <br>
            <button type="submit" class="btn btn-add">➕ ذخیره و انتشار در ربات</button>
        </form>
    </div>

    <div class="card">
        <h3>🛍️ پلن‌های فعال تعریف‌شده توسط ادمین</h3>
        <table>
            <tr>
                <th>شناسه</th>
                <th>نام محصول</th>
                <th>قیمت (تومان)</th>
                <th>مدت اعتبار</th>
                <th>لینک درگاه پرداخت</th>
                <th>عملیات</th>
            </tr>
            {% for key, p in plans.items() %}
            <tr>
                <td><code>{{ key }}</code></td>
                <td><b>{{ p.name }}</b></td>
                <td>{{ "{:,}".format(p.price|int) }} تومان</td>
                <td>{{ p.days }} روز</td>
                <td><a href="{{ p.pay_url }}" target="_blank" style="color:#38bdf8;">لینک پرداخت پی‌پینگ</a></td>
                <td>
                    <a href="/admin/delete_plan/{{ key }}" class="btn btn-del" onclick="return confirm('آیا از حذف این پلن مطمئن هستید؟')">حذف پلن</a>
                </td>
            </tr>
            {% else %}
            <tr><td colspan="6" style="text-align:center;color:#94a3b8;">هنوز هیچ پلنی تعریف نکرده‌اید! از فرم بالا اولین پلن خود را بسازید.</td></tr>
            {% endfor %}
        </table>
    </div>

    <div class="card">
        <h3>👥 کاربران دارای اشتراک فعال</h3>
        <table>
            <tr>
                <th>آیدی تلگرام</th>
                <th>پلن فعال</th>
                <th>تاریخ شروع</th>
                <th>کد لایسنس</th>
                <th>عملیات</th>
            </tr>
            {% for uid, s in subs.items() %}
            <tr>
                <td>{{ uid }}</td>
                <td>{{ s.plan }}</td>
                <td>{{ s.date }}</td>
                <td><code>{{ s.license_key }}</code></td>
                <td>
                    <a href="/admin/revoke_sub/{{ uid }}" class="btn btn-del">ابطال لایسنس</a>
                </td>
            </tr>
            {% else %}
            <tr><td colspan="5" style="text-align:center;color:#94a3b8;">هنوز کاربری ثبت نشده است.</td></tr>
            {% endfor %}
        </table>
    </div>
</body>
</html>
"""

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        user = request.form.get('username')
        pwd = request.form.get('password')
        if user == ADMIN_USER and pwd == ADMIN_PASS:
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
    subs = load_json(DATA_FILE, {})
    return render_template_string(HTML_ADMIN, plans=plans, subs=subs)

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
        "pay_url": request.form.get('pay_url')
    }
    save_json(PLANS_FILE, plans)
    return redirect('/admin')

@app.route('/admin/delete_plan/<plan_id>')
def delete_plan(plan_id):
    if not session.get('logged_in'):
        return redirect('/login')
    plans = get_plans()
    if plan_id in plans:
        del plans[plan_id]
        save_json(PLANS_FILE, plans)
    return redirect('/admin')

@app.route('/admin/revoke_sub/<uid>')
def revoke_sub(uid):
    if not session.get('logged_in'):
        return redirect('/login')
    subs = load_json(DATA_FILE, {})
    if str(uid) in subs:
        del subs[str(uid)]
        save_json(DATA_FILE, subs)
    return redirect('/admin')

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
    print("🚀 پنل مدیریت وب و ربات تلگرام با موفقیت روشن شدند...")
    bot.infinity_polling(skip_pending=True)
