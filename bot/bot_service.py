import time
import json
import datetime
import telebot
from telebot import types
from config import config
from database import get_db, User, Setting
from message_manager import message_manager
from ai import ai_engine
from .keyboards import main_keyboard, plans_inline_keyboard

bot = telebot.TeleBot(config.BOT_TOKEN)

def get_setting(key: str, default: str = "") -> str:
    with get_db() as db:
        s = db.query(Setting).filter_by(key=key).first()
        return s.value if s and s.value is not None else default

def get_plans() -> dict:
    raw = get_setting("plans_data", "{}")
    try:
        return json.loads(raw)
    except:
        return {}

def save_plans(plans: dict):
    with get_db() as db:
        s = db.query(Setting).filter_by(key="plans_data").first()
        if not s:
            s = Setting(key="plans_data", value=json.dumps(plans, ensure_ascii=False))
            db.add(s)
        else:
            s.value = json.dumps(plans, ensure_ascii=False)

# ----------------- هندلرهای اصلی ربات -----------------
@bot.message_handler(commands=['start'])
def handle_start(message):
    user_id = message.chat.id
    first_name = message.from_user.first_name or "کاربر گرامی"
    username = f"@{message.from_user.username}" if message.from_user.username else None

    # ثبت در دیتابیس
    message_manager.record_message(
        chat_id=user_id,
        sender_id=user_id,
        sender_name=first_name,
        username=username,
        sender_type="client",
        text="/start",
        message_id=message.message_id,
        chat_title=first_name,
        source="bot"
    )

    welcome_template = get_setting(
        "welcome_text",
        "سلام {name} عزیز! خوش آمدید. 🌹\n\n⚡️ به سیستم هوشمند و رسمی خرید اشتراک خوش آمدید.\nجهت مشاهده و خرید اشتراک از دکمه‌های زیر استفاده نمایید:"
    )
    reply_text = welcome_template.replace("{name}", first_name)
    bot.send_message(user_id, reply_text, reply_markup=main_keyboard())

    # ثبت پاسخ ربات در دیتابیس
    message_manager.record_message(
        chat_id=user_id,
        sender_type="bot",
        text=reply_text,
        source="bot",
        status="sent"
    )

@bot.message_handler(func=lambda msg: msg.text == "📋 تعرفه‌ها و پلن‌ها")
def handle_show_plans(message):
    plans = get_plans()
    header_text = get_setting("plans_header_text", "📋 لیست تعرفه‌ها و پلن‌های فعال اشتراک:")
    
    if not plans:
        bot.send_message(message.chat.id, "⚠️ در حال حاضر هیچ پلنی فعال نیست. لطفاً بعداً بررسی کنید.")
        return

    text = f"{header_text}\n\n"
    for key, p in plans.items():
        text += f"🔹 **{p['name']}**\n   💰 قیمت: {int(p['price']):,} تومان\n   ⏳ مدت اعتبار: {p['days']} روز\n"
        if p.get('desc'):
            text += f"   📝 ویژگی: {p['desc']}\n"
        text += "\n"

    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("💎 خرید آنلاین هرکدام از پلن‌ها", callback_data="open_buy_menu"))
    bot.send_message(message.chat.id, text, parse_mode="Markdown", reply_markup=markup)

@bot.message_handler(func=lambda msg: msg.text == "💎 خرید اشتراک")
def handle_buy_menu(message):
    plans = get_plans()
    if not plans:
        bot.send_message(message.chat.id, "⚠️ در حال حاضر هیچ پلنی فعال نیست. با پشتیبانی در ارتباط باشید.")
        return
    markup = plans_inline_keyboard(plans)
    bot.send_message(message.chat.id, "👇 لطفاً محصول مورد نظر خود را جهت خرید انتخاب فرمایید:", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: call.data == "open_buy_menu")
def cb_open_buy(call):
    handle_buy_menu(call.message)

@bot.callback_query_handler(func=lambda call: call.data.startswith("select_"))
def process_product_selection(call):
    plan_key = call.data.replace("select_", "")
    plans = get_plans()
    plan = plans.get(plan_key)
    if not plan:
        bot.answer_callback_query(call.id, "پلن پیدا نشد!", show_alert=True)
        return

    markup = types.InlineKeyboardMarkup(row_width=1)
    btn_pay = types.InlineKeyboardButton(f"💳 ورود به درگاه پرداخت آنلاین ({int(plan['price']):,} تومان)", url=plan['pay_url'])
    btn_verify = types.InlineKeyboardButton("✅ پرداخت کردم (ثبت کد رهگیری / فیش)", callback_data=f"done_{plan_key}")
    markup.add(btn_pay, btn_verify)

    text = (
        f"💎 **پیش‌فاکتور خرید محصول:**\n\n"
        f"📦 نام پلن: **{plan['name']}**\n"
        f"💰 مبلغ قابل پرداخت: **{int(plan['price']):,} تومان**\n"
        f"⏳ مدت اعتبار: {plan['days']} روز\n"
    )
    if plan.get('desc'):
        text += f"📝 ویژگی‌ها: {plan['desc']}\n"
    text += "\n🔗 روی دکمه درگاه پرداخت کلیک کنید. پس از پرداخت آنلاین، دکمه «پرداخت کردم» را لمس کنید:"
    bot.send_message(call.message.chat.id, text, reply_markup=markup, parse_mode="Markdown")

@bot.callback_query_handler(func=lambda call: call.data.startswith("done_"))
def ask_payment_ref(call):
    plan_key = call.data.replace("done_", "")
    plans = get_plans()
    plan = plans.get(plan_key, {"name": "محصول اشتراک", "price": 0, "days": 30})
    user_id = call.from_user.id
    name = call.from_user.first_name or "کاربر"
    username = f"@{call.from_user.username}" if call.from_user.username else "ندارد"

    guide_text = get_setting(
        "receipt_guide_text",
        "🙏 سفارش شما ثبت شد! لطفاً شماره پیگیری یا عکس فیش واریزی خود را در پاسخ به این پیام ارسال نمایید تا بلافاصله تایید شود."
    )
    bot.send_message(call.message.chat.id, guide_text)

    # دکمه تایید برای ادمین
    admin_markup = types.InlineKeyboardMarkup(row_width=2)
    btn_ok = types.InlineKeyboardButton("✅ تایید و فعالسازی", callback_data=f"adm_ok_{user_id}_{plan_key}")
    btn_no = types.InlineKeyboardButton("❌ رد سفارش", callback_data=f"adm_no_{user_id}")
    admin_markup.add(btn_ok, btn_no)

    bot.send_message(
        config.ADMIN_CHAT_ID,
        f"🔔 **ثبت سفارش پرداخت جدید!**\n\n"
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
    if call.from_user.id != config.ADMIN_CHAT_ID:
        bot.answer_callback_query(call.id, "شما دسترسی ادمین ندارید!")
        return
    parts = call.data.split("_")
    action = parts[1]
    target_id = int(parts[2])

    if action == "ok":
        plan_key = parts[3]
        plans = get_plans()
        plan = plans.get(plan_key, {"name": "اشتراک ویژه", "days": 30})
        lic = f"LIC-{int(time.time())}-{str(target_id)[-4:]}"

        with get_db() as db:
            u = db.query(User).filter_by(telegram_id=target_id).first()
            if not u:
                u = User(telegram_id=target_id, first_name="کاربر")
                db.add(u)
            u.has_active_sub = True
            u.sub_plan = plan['name']
            u.sub_days = int(plan.get('days', 30))
            u.sub_start_date = str(datetime.date.today())
            u.license_key = lic

        try:
            bot.send_message(
                target_id,
                f"🎉 **پرداخت شما تایید و اشتراک فعال گردید!**\n\n"
                f"🔹 پلن: {plan['name']}\n"
                f"⏳ مدت اعتبار: {plan.get('days', 30)} روز\n"
                f"🔑 کد لایسنس شما:\n`{lic}`\n\n"
                "با تشکر از خرید شما 🌹",
                parse_mode="Markdown"
            )
        except Exception:
            pass
        bot.edit_message_text(f"✅ اشتراک کاربر `{target_id}` با موفقیت فعال شد.", chat_id=call.message.chat.id, message_id=call.message.message_id)
    else:
        try:
            bot.send_message(
                target_id,
                "⚠️ متاسفانه سفارش شما توسط مدیریت تایید نشد. در صورت بروز اشتباه با پشتیبانی در ارتباط باشید."
            )
        except Exception:
            pass
        bot.edit_message_text(f"❌ سفارش کاربر `{target_id}` رد شد.", chat_id=call.message.chat.id, message_id=call.message.message_id)

@bot.message_handler(func=lambda msg: msg.text == "💳 شماره کارت واریز")
def handle_card_info(message):
    card_enabled = get_setting("card_payment_enabled", "true").lower() in ("true", "1")
    if not card_enabled:
        return
    bank_name = get_setting("bank_name", "بانک ملی")
    card_holder = get_setting("card_holder", "مدیریت")
    card_number = get_setting("card_number", "6037-9975-1234-5678")

    text = (
        "💳 **اطلاعات حساب بانکی جهت واریز کارت به کارت:**\n\n"
        f"🏦 بانک: **{bank_name}**\n"
        f"👤 به نام: **{card_holder}**\n"
        f"🔢 شماره کارت: `{card_number}`\n\n"
        "*(برای کپی شماره کارت روی آن لمس کنید)*\n"
        "پس از واریز، از بخش «خرید اشتراک» فیش واریزی خود را ارسال فرمایید."
    )
    bot.send_message(message.chat.id, text, parse_mode="Markdown")

@bot.message_handler(func=lambda msg: msg.text == "📞 پشتیبانی")
def handle_support(message):
    support_id = get_setting("support_id", "@AdminSupport")
    support_template = get_setting("support_text", "📞 جهت هرگونه راهنمایی، پیگیری اشتراک یا سوالات، با آیدی زیر در ارتباط باشید:\n{support_id}")
    text = support_template.replace("{support_id}", support_id)
    bot.send_message(message.chat.id, text)

@bot.message_handler(func=lambda msg: msg.text == "👤 وضعیت اشتراک من")
def handle_my_sub(message):
    user_id = message.chat.id
    with get_db() as db:
        user = db.query(User).filter_by(telegram_id=user_id).first()
        if user and user.has_active_sub:
            bot.send_message(
                user_id,
                f"✅ **اشتراک شما فعال است!**\n\n"
                f"🔹 محصول: {user.sub_plan}\n"
                f"📅 تاریخ ثبت: {user.sub_start_date}\n"
                f"⏳ اعتبار: {user.sub_days} روز\n"
                f"🔑 کد لایسنس شما:\n`{user.license_key}`",
                parse_mode="Markdown"
            )
            return

    bot.send_message(user_id, "❌ شما در حال حاضر اشتراک فعالی ندارید.\nجهت خرید روی دکمه «💎 خرید اشتراک» کلیک کنید.")

# ----------------- پردازش هوشمند پیام‌های کاربران با AI -----------------
@bot.message_handler(content_types=['text', 'photo', 'document', 'voice'])
def handle_incoming_messages(message):
    chat_id = message.chat.id
    user_id = message.from_user.id
    first_name = message.from_user.first_name or "کاربر"
    username = f"@{message.from_user.username}" if message.from_user.username else None
    text = message.text or message.caption or "[فایل یا تصویر]"

    # ثبت پیام کاربر در Message Manager
    message_manager.record_message(
        chat_id=chat_id,
        sender_id=user_id,
        sender_name=first_name,
        username=username,
        sender_type="client",
        text=text,
        message_id=message.message_id,
        media_type=message.content_type,
        chat_title=first_name,
        source="bot"
    )

    # اگر پیام از سمت ادمین نیست، برای ادمین هم فوروارد شود (پشتیبانی سنتی)
    if chat_id != config.ADMIN_CHAT_ID:
        try:
            bot.forward_message(config.ADMIN_CHAT_ID, chat_id, message.message_id)
        except Exception:
            pass

    # بررسی فعال بودن پاسخگویی خودکار AI برای این چت
    if message.content_type == 'text' and message_manager.is_ai_active_for_chat(chat_id):
        history = message_manager.get_chat_history(chat_id, limit=6)
        ai_reply = ai_engine.generate_response(chat_id, text, history)
        
        bot.send_message(chat_id, ai_reply)
        
        # ثبت پاسخ AI در Message Manager
        message_manager.record_message(
            chat_id=chat_id,
            sender_type="ai",
            text=ai_reply,
            source="bot",
            status="sent",
            is_ai_replied=True
        )
