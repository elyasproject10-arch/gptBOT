import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Play, 
  ShieldCheck, 
  CreditCard, 
  MessageSquare, 
  Terminal, 
  CheckCircle2, 
  Info,
  ExternalLink
} from 'lucide-react';

export const simpleBotPythonCode = `# ================================================================
# 🤖 ربات تلگرام فروش اشتراک (نسخه فوق‌العاده ساده - تک‌فایل)
# بدون نیاز به جنگو، بدون نیاز به درگاه پرداخت و بدون نیاز به سرور!
# 
# 🚀 نحوه راه‌اندازی در ۲ ثانیه:
# ۱. دستور زیر را در ترمینال بزنید:
#    pip install pyTelegramBotAPI
# ۲. دستور زیر را بزنید تا ربات روشن شود:
#    python bot.py
# ================================================================

import telebot
from telebot import types
import json
import os

# ----------------- ⚙️ تنظیمات اختصاصی شما -----------------
# ۱. توکن ربات تلگرام:
BOT_TOKEN = "8353109188:AAEv_SXgKtLA2UfCeK6chm-PmzDHj7pn5S4"

# ۲. آیدی عددی تلگرام ادمین:
ADMIN_CHAT_ID = 5490508090

# ۳. مشخصات کارت بانکی شما برای واریز وجه توسط مشتری:
CARD_NUMBER = "6037-9975-1234-5678"
CARD_HOLDER = "مدیریت اشتراک"
BANK_NAME = "بانک ملی"

# ۴. پلن‌های اشتراک شما (نام، قیمت به تومان، مدت اعتبار به روز):
PLANS = {
    "plan_1": {"name": "پلن برنزی (۱ ماهه)", "price": 120000, "days": 30},
    "plan_2": {"name": "پلن نقره‌ای (۳ ماهه)", "price": 320000, "days": 90},
    "plan_3": {"name": "پلن طلایی VIP (۶ ماهه)", "price": 590000, "days": 180},
}
# -------------------------------------------------------------

bot = telebot.TeleBot(BOT_TOKEN)

# دیتابیس ساده متنی برای ذخیره وضعیت کاربران
DATA_FILE = "subscribers.json"
user_state = {}

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ساخت کیبورد اصلی شیشه‌ای
def main_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    btn_buy = types.KeyboardButton("💎 خرید اشتراک")
    btn_plans = types.KeyboardButton("📋 لیست تعرفه‌ها")
    btn_card = types.KeyboardButton("💳 شماره کارت واریز")
    btn_my_sub = types.KeyboardButton("👤 اشتراک من")
    btn_support = types.KeyboardButton("📞 پشتیبانی")
    markup.add(btn_buy, btn_plans)
    markup.add(btn_card, btn_my_sub)
    markup.add(btn_support)
    return markup

# دستور استارت
@bot.message_handler(commands=['start'])
def send_welcome(message):
    user_id = message.from_user.id
    name = message.from_user.first_name or "کاربر عزیز"
    welcome_text = (
        f"سلام {name} عزیز! خوش آمدید. 🌹\\n\\n"
        "⚡️ به ربات رسمی فروش اشتراک خوش آمدید.\\n"
        "از دکمه‌های زیر برای خرید یا مدیریت اشتراک خود استفاده کنید:"
    )
    bot.send_message(user_id, welcome_text, reply_markup=main_keyboard())

# مشاهده لیست تعرفه‌ها
@bot.message_handler(func=lambda msg: msg.text == "📋 لیست تعرفه‌ها")
def show_plans_text(message):
    text = "📋 **تعرفه‌های اشتراک فعال:**\\n\\n"
    for key, p in PLANS.items():
        text += f"🔹 **{p['name']}**\\n   💰 قیمت: {p['price']:,} تومان\\n   ⏳ مدت: {p['days']} روز\\n\\n"
    text += "برای خرید، روی دکمه «💎 خرید اشتراک» کلیک کنید."
    bot.send_message(message.chat.id, text, parse_mode="Markdown")

# شماره کارت
@bot.message_handler(func=lambda msg: msg.text == "💳 شماره کارت واریز")
def show_card(message):
    text = (
        "💳 **اطلاعات حساب جهت واریز وجه:**\\n\\n"
        f"🏦 بانک: {BANK_NAME}\\n"
        f"👤 به نام: **{CARD_HOLDER}**\\n"
        f"🔢 شماره کارت: \`{CARD_NUMBER}\`\\n\\n"
        "*(جهت کپی شماره کارت، کافیست روی آن لمس کنید)*\\n"
        "پس از واریز، از بخش «خرید اشتراک» عکس فیش را ارسال نمایید."
    )
    bot.send_message(message.chat.id, text, parse_mode="Markdown")

# پشتیبانی
@bot.message_handler(func=lambda msg: msg.text == "📞 پشتیبانی")
def support(message):
    bot.send_message(message.chat.id, "جهت پیگیری سفارشات یا سوالات به آیدی ادمین پیام دهید:\\n@AdminSupport")

# اشتراک من
@bot.message_handler(func=lambda msg: msg.text == "👤 اشتراک من")
def my_sub(message):
    user_id = str(message.from_user.id)
    data = load_data()
    if user_id in data and data[user_id].get("active"):
        sub = data[user_id]
        bot.send_message(
            message.chat.id,
            f"✅ **اشتراک شما فعال است!**\\n\\n"
            f"🔹 پلن: {sub.get('plan')}\\n"
            f"⏳ تاریخ فعال‌سازی: {sub.get('date')}\\n"
            f"🔑 کلید اختصاصی: \`{sub.get('license_key', 'ACT-PREMIUM-99')}\`",
            parse_mode="Markdown"
        )
    else:
        bot.send_message(message.chat.id, "❌ شما در حال حاضر اشتراک فعالی ندارید.\\nبرای خرید از دکمه «💎 خرید اشتراک» استفاده کنید.")

# دکمه خرید اشتراک
@bot.message_handler(func=lambda msg: msg.text == "💎 خرید اشتراک")
def buy_subscription(message):
    markup = types.InlineKeyboardMarkup(row_width=1)
    for key, p in PLANS.items():
        btn = types.InlineKeyboardButton(f"{p['name']} - {p['price']:,} تومان", callback_data=f"buy_{key}")
        markup.add(btn)
    
    bot.send_message(
        message.chat.id,
        "لطفاً یکی از پلن‌های زیر را جهت خرید انتخاب کنید:",
        reply_markup=markup
    )

# دریافت کلیک روی پلن
@bot.callback_query_handler(func=lambda call: call.data.startswith("buy_"))
def process_plan_choice(call):
    plan_key = call.data.replace("buy_", "")
    plan = PLANS.get(plan_key)
    if not plan:
        return
    
    user_state[call.from_user.id] = {"selected_plan": plan['name'], "price": plan['price']}
    
    text = (
        f"✅ شما پلن **{plan['name']}** را انتخاب کردید.\\n\\n"
        f"💰 مبلغ قابل پرداخت: **{plan['price']:,} تومان**\\n\\n"
        f"💳 شماره کارت: \`{CARD_NUMBER}\`\\n"
        f"👤 به نام: {CARD_HOLDER} ({BANK_NAME})\\n\\n"
        "📸 **مرحله آخر:** لطفاً پس از کارت‌به‌کارت، **عکس فیش واریزی** خود را در همینجا ارسال کنید."
    )
    bot.send_message(call.message.chat.id, text, parse_mode="Markdown")

# دریافت عکس فیش واریز از مشتری و ارسال برای ادمین
@bot.message_handler(content_types=['photo'])
def handle_receipt_photo(message):
    user_id = message.from_user.id
    name = message.from_user.first_name or "مشتری"
    username = f"@{message.from_user.username}" if message.from_user.username else "ندارد"
    selected = user_state.get(user_id, {}).get("selected_plan", "مشخص نشده")
    price = user_state.get(user_id, {}).get("price", 0)

    # پیام تشکر به مشتری
    bot.reply_to(message, "✅ فیش واریزی شما دریافت شد!\\nدرخواست شما به ادمین ارسال گردید و پس از بررسی فعال خواهد شد. سپاس از شکیبایی شما.")

    # ارسال فیش برای ادمین به همراه دکمه‌های تایید / رد
    photo_file_id = message.photo[-1].file_id
    admin_markup = types.InlineKeyboardMarkup(row_width=2)
    btn_approve = types.InlineKeyboardButton("✅ تایید و فعالسازی", callback_data=f"approve_{user_id}_{selected}")
    btn_reject = types.InlineKeyboardButton("❌ رد درخواست", callback_data=f"reject_{user_id}")
    admin_markup.add(btn_approve, btn_reject)

    admin_caption = (
        f"🔔 **فیش واریزی جدید دریافت شد!**\\n\\n"
        f"👤 مشتری: {name} ({username})\\n"
        f"🆔 آیدی عددی: \`{user_id}\`\\n"
        f"💎 پلن انتخابی: {selected}\\n"
        f"💰 مبلغ: {price:,} تومان"
    )
    bot.send_photo(ADMIN_CHAT_ID, photo_file_id, caption=admin_caption, reply_markup=admin_markup, parse_mode="Markdown")

# دکمه تایید یا رد توسط ادمین
@bot.callback_query_handler(func=lambda call: call.data.startswith("approve_") or call.data.startswith("reject_"))
def admin_action(call):
    if call.from_user.id != ADMIN_CHAT_ID:
        bot.answer_callback_query(call.id, "شما ادمین نیستید!", show_alert=True)
        return
    
    parts = call.data.split("_")
    action = parts[0]
    target_user_id = parts[1]
    
    if action == "approve":
        plan_name = "_".join(parts[2:])
        # فعالسازی اشتراک
        data = load_data()
        import datetime
        data[target_user_id] = {
            "active": True,
            "plan": plan_name,
            "date": str(datetime.date.today()),
            "license_key": f"KEY-{target_user_id[-4:]}-ACTIVE"
        }
        save_data(data)
        
        # اطلاع به مشتری
        try:
            bot.send_message(
                int(target_user_id),
                f"🎉 **تبریک! پرداخت شما تایید و اشتراک شما فعال شد.**\\n\\n"
                f"💎 پلن فعال: {plan_name}\\n"
                f"🔑 کد دسترسی / لایسنس شما:\\n\`KEY-{target_user_id[-4:]}-ACTIVE\`\\n\\n"
                "با تشکر از اعتماد شما 🌹",
                parse_mode="Markdown"
            )
        except Exception as e:
            print("خطا در ارسال پیام به مشتری:", e)
        
        bot.edit_message_caption("✅ این فیش واریزی توسط شما **تایید و فعال** شد.", chat_id=call.message.chat.id, message_id=call.message.message_id)
        bot.answer_callback_query(call.id, "اشتراک مشتری فعال شد!")

    elif action == "reject":
        # اطلاع به مشتری
        try:
            bot.send_message(
                int(target_user_id),
                "⚠️ متاسفانه فیش ارسالی شما توسط مدیریت تایید نشد.\\nلطفاً در صورت بروز اشتباه با پشتیبانی تماس بگیرید."
            )
        except Exception as e:
            print("خطا:", e)
        
        bot.edit_message_caption("❌ این فیش واریزی توسط شما **رد شد**.", chat_id=call.message.chat.id, message_id=call.message.message_id)
        bot.answer_callback_query(call.id, "درخواست رد شد.")

print("🚀 ربات با موفقیت روشن شد و آماده پاسخگویی است...")
bot.infinity_polling()
`;

export const SimpleBotView: React.FC<{
  onOpenOnlineAdmin: () => void;
}> = ({ onOpenOnlineAdmin }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(simpleBotPythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPy = () => {
    const blob = new Blob([simpleBotPythonCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bot.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                راه‌حل ۱۰۰٪ بدون دردسر (تک‌فایل پایتون)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-bold">
                بدون نیاز به درگاه پرداخت
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 text-xs font-bold">
                بدون نیاز به جنگو و سرور
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              ربات پایتون فوق‌العاده ساده (فقط یک فایل <code className="text-emerald-400 font-mono">bot.py</code>)
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              دیگر نیازی به راه‌اندازی سرور جنگو، دیتابیس یا گرفتن درگاه پرداخت و نماد الکترونیک نیست! 
              فقط با یک فایل پایتون، ربات شما شروع به کار می‌کند، مشتری شماره کارت شما را می‌بیند، عکس فیش را می‌فرستد و شما با یک دکمه در تلگرام اشتراک او را تایید می‌کنید.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleDownloadPy}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 cursor-pointer transition whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              دانلود فایل آماده bot.py
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm cursor-pointer transition whitespace-nowrap"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'کد کپی شد!' : 'کپی کل کد پایتون'}
            </button>
          </div>
        </div>
      </div>

      {/* 2 Step Quickstart Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
              ۱
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">نصب کتابخانه ساده پایتون (فقط یک‌بار)</h3>
              <p className="text-xs text-slate-400">بدون نیاز به ده‌ها پکیج حجیم، فقط این دستور را در ترمینال بزنید:</p>
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-400 flex items-center justify-between dir-ltr">
            <span>pip install pyTelegramBotAPI</span>
            <button 
              onClick={() => navigator.clipboard.writeText('pip install pyTelegramBotAPI')}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
              title="کپی دستور"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-500/30">
              ۲
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">اجرا و روشن شدن ربات</h3>
              <p className="text-xs text-slate-400">فایل bot.py را اجرا کنید تا ربات سریعاً آنلاین شود:</p>
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-xs text-sky-400 flex items-center justify-between dir-ltr">
            <span>python bot.py</span>
            <button 
              onClick={() => navigator.clipboard.writeText('python bot.py')}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
              title="کپی دستور"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Clarification on Online Admin (NO software install needed!) */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 mt-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              آیا برای پنل ادمین نیاز به دانلود نرم‌افزار دارید؟ خیر!
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              همین صفحه‌ای که در مرورگر شما باز است، دارای پنل مدیریت آماده و شبیه‌ساز آنلاین است. 
              می‌توانید کاربران، سفارشات و پلن‌ها را مستقیماً همینجا مدیریت کنید بدون اینکه چیزی نصب کنید.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenOnlineAdmin}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition whitespace-nowrap cursor-pointer flex items-center gap-2"
        >
          ورود به پنل مدیریت آنلاین
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <span className="text-xs font-mono text-slate-300 font-bold ml-2">bot.py (کد کامل آماده اجرا)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'کپی شد' : 'کپی کد'}
            </button>
            <button
              onClick={handleDownloadPy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-medium border border-emerald-500/40 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5" />
              دانلود bot.py
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#0d1117] max-h-[520px] overflow-y-auto font-mono text-xs text-slate-300 dir-ltr text-left leading-relaxed">
          <pre>{simpleBotPythonCode}</pre>
        </div>
      </div>
    </div>
  );
};
