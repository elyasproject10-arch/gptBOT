export interface CodeFile {
  path: string;
  filename: string;
  folder: string;
  language: string;
  description: string;
  content: string;
}

export const pythonProjectFiles: CodeFile[] = [
  {
    path: 'bot.py',
    filename: 'bot.py',
    folder: 'Root',
    language: 'python',
    description: 'ربات تلگرام فوق‌العاده ساده (تک‌فایل، بدون جنگو و بدون درگاه پرداخت)',
    content: `# ================================================================
# 🤖 ربات تلگرام فروش اشتراک (نسخه فوق‌العاده ساده - تک‌فایل)
# بدون نیاز به جنگو، بدون نیاز به درگاه پرداخت و بدون نیاز به سرور پیچیده!
# 
# 🚀 نحوه راه‌اندازی سریع در ۲ مرحله:
# ۱. در ترمینال بزنید:
#    pip install pyTelegramBotAPI
# ۲. دستور زیر را بزنید تا ربات آنلاین شود:
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

def main_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add(types.KeyboardButton("💎 خرید اشتراک"), types.KeyboardButton("📋 لیست تعرفه‌ها"))
    markup.add(types.KeyboardButton("💳 شماره کارت واریز"), types.KeyboardButton("👤 اشتراک من"))
    markup.add(types.KeyboardButton("📞 پشتیبانی"))
    return markup

@bot.message_handler(commands=['start'])
def send_welcome(message):
    user_id = message.from_user.id
    name = message.from_user.first_name or "کاربر عزیز"
    welcome_text = (
        f"سلام {name} عزیز! خوش آمدید. 🌹\\n\\n"
        "⚡️ به ربات رسمی فروش اشتراک خوش آمدید.\\n"
        "از دکمه‌های زیر جهت خرید یا مدیریت اشتراک خود استفاده کنید:"
    )
    bot.send_message(user_id, welcome_text, reply_markup=main_keyboard())

@bot.message_handler(func=lambda msg: msg.text == "📋 لیست تعرفه‌ها")
def show_plans_text(message):
    text = "📋 **تعرفه‌های اشتراک فعال:**\\n\\n"
    for key, p in PLANS.items():
        text += f"🔹 **{p['name']}**\\n   💰 قیمت: {p['price']:,} تومان\\n   ⏳ مدت: {p['days']} روز\\n\\n"
    text += "برای خرید، روی دکمه «💎 خرید اشتراک» کلیک کنید."
    bot.send_message(message.chat.id, text, parse_mode="Markdown")

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

@bot.message_handler(func=lambda msg: msg.text == "📞 پشتیبانی")
def support(message):
    bot.send_message(message.chat.id, "جهت پیگیری سفارشات یا سوالات به آیدی ادمین پیام دهید:\\n@AdminSupport")

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

@bot.message_handler(func=lambda msg: msg.text == "💎 خرید اشتراک")
def buy_subscription(message):
    markup = types.InlineKeyboardMarkup(row_width=1)
    for key, p in PLANS.items():
        btn = types.InlineKeyboardButton(f"{p['name']} - {p['price']:,} تومان", callback_data=f"buy_{key}")
        markup.add(btn)
    
    bot.send_message(message.chat.id, "لطفاً یکی از پلن‌های زیر را جهت خرید انتخاب کنید:", reply_markup=markup)

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
        "📸 **مرحله آخر:** لطفاً پس از کارت‌به‌کارت، **عکس فیش واریزی** خود را در همینجا ارسال نمایید."
    )
    bot.send_message(call.message.chat.id, text, parse_mode="Markdown")

@bot.message_handler(content_types=['photo'])
def handle_receipt_photo(message):
    user_id = message.from_user.id
    name = message.from_user.first_name or "مشتری"
    username = f"@{message.from_user.username}" if message.from_user.username else "ندارد"
    selected = user_state.get(user_id, {}).get("selected_plan", "مشخص نشده")
    price = user_state.get(user_id, {}).get("price", 0)

    bot.reply_to(message, "✅ فیش واریزی شما دریافت شد!\\nدرخواست شما به ادمین ارسال گردید و پس از بررسی فعال خواهد شد. سپاس از صبوری شما.")

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
        data = load_data()
        import datetime
        data[target_user_id] = {
            "active": True,
            "plan": plan_name,
            "date": str(datetime.date.today()),
            "license_key": f"KEY-{target_user_id[-4:]}-ACTIVE"
        }
        save_data(data)
        
        try:
            bot.send_message(
                int(target_user_id),
                f"🎉 **تبریک! پرداخت شما تایید و اشتراک شما فعال شد.**\\n\\n"
                f"💎 پلن فعال: {plan_name}\\n"
                f"🔑 کد دسترسی / لایسنس شما:\\n\`KEY-{target_user_id[-4:]}-ACTIVE\`\\n\\n"
                "با تشکر از خرید شما 🌹",
                parse_mode="Markdown"
            )
        except Exception as e:
            print("خطا در ارسال پیام به مشتری:", e)
        
        bot.edit_message_caption("✅ این فیش واریزی توسط شما **تایید و فعال** شد.", chat_id=call.message.chat.id, message_id=call.message.message_id)
        bot.answer_callback_query(call.id, "اشتراک مشتری فعال شد!")

    elif action == "reject":
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
`
  },
  {
    path: 'requirements.txt',
    filename: 'requirements.txt',
    folder: 'Root',
    language: 'text',
    description: 'کتابخانه‌ها و پیش‌نیازهای پروژه',
    content: `pyTelegramBotAPI>=4.14.0
requests
python-dotenv`
  },
  {
    path: '.env',
    filename: '.env',
    folder: 'Root',
    language: 'bash',
    description: 'تنظیمات محرمانه و کلیدهای توکن',
    content: `SECRET_KEY=django-insecure-ai-subscription-secret-key-prod-2026
DEBUG=True

# Bot Tokens
TELEGRAM_BOT_TOKEN=8353109188:AAEv_SXgKtLA2UfCeK6chm-PmzDHj7pn5S4
BALE_BOT_TOKEN=your_bale_bot_token_here
ADMIN_CHAT_ID=5490508090

# PayPing Settings
PAYPING_TOKEN=BF1A19B315DFAC5BD881033340A394C80A1A96BA92E605EBAFF9C822B5F1D278-1
PAYPING_GOTO_URL=https://api.payping.ir/v2/pay/gotoipg/
BASE_URL=https://your-ngrok-domain.ngrok-free.app  # آدرس دامین یا انگرک برای کالبک درگاه`
  },
  {
    path: 'manage.py',
    filename: 'manage.py',
    folder: 'Root',
    language: 'python',
    description: 'نقطه ورود دستورات مدیریت جنگو',
    content: `#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()`
  },
  {
    path: 'config/settings.py',
    filename: 'settings.py',
    folder: 'config',
    language: 'python',
    description: 'تنظیمات اصلی پروژه جنگو و پایگاه داده مشترک',
    content: `import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'default-unsafe-key')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'store',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

LANGUAGE_CODE = 'fa-ir'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'`
  },
  {
    path: 'config/urls.py',
    filename: 'urls.py',
    folder: 'config',
    language: 'python',
    description: 'مسیریابی ریشه و پنل ادمین',
    content: `from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('store.urls')),
]`
  },
  {
    path: 'store/models.py',
    filename: 'models.py',
    folder: 'store',
    language: 'python',
    description: 'مدل‌های داده‌ای: کاربران، دسته‌بندی محصولات، پلن‌ها، سفارشات و اشتراک‌ها',
    content: `from django.db import models
from django.utils import timezone
from datetime import timedelta

class BotUser(models.Model):
    PLATFORM_CHOICES = (
        ('telegram', 'Telegram'),
        ('bale', 'Bale'),
    )
    user_id = models.BigIntegerField(unique=True, verbose_name="شناسه کاربری پیام‌رسان")
    chat_id = models.BigIntegerField(verbose_name="چت آیدی")
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES, verbose_name="پیام‌رسان")
    first_name = models.CharField(max_length=150, blank=True, null=True, verbose_name="نام")
    username = models.CharField(max_length=150, blank=True, null=True, verbose_name="نام کاربری")
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="شماره همراه")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ عضویت")

    def __str__(self):
        return f"{self.first_name or 'User'} ({self.phone_number or 'No Phone'}) - {self.platform}"

    class Meta:
        verbose_name = "کاربر ربات"
        verbose_name_plural = "کاربران ربات"


class ProductCategory(models.Model):
    name = models.CharField(max_length=100, verbose_name="نام محصول (مثلاً ChatGPT)")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "دسته‌بندی محصول"
        verbose_name_plural = "دسته‌بندی محصولات"


class Plan(models.Model):
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, related_name='plans', verbose_name="محصول")
    title = models.CharField(max_length=100, verbose_name="عنوان پلن (مثلاً ۱ ماهه پلاس)")
    description = models.TextField(blank=True, verbose_name="توضیحات پلن")
    price = models.BigIntegerField(verbose_name="قیمت (تومان)")
    duration_days = models.IntegerField(default=30, verbose_name="مدت به روز")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    def __str__(self):
        return f"{self.category.name} - {self.title} ({self.price:,} تومان)"

    class Meta:
        verbose_name = "پلن اشتراک"
        verbose_name_plural = "پلن‌های اشتراک"


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'در انتظار پرداخت'),
        ('success', 'موفق'),
        ('failed', 'ناموفق'),
    )
    user = models.ForeignKey(BotUser, on_delete=models.CASCADE, verbose_name="کاربر")
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, verbose_name="پلن انتخابی")
    amount = models.BigIntegerField(verbose_name="مبلغ پرداختی (تومان)")
    payping_code = models.CharField(max_length=100, blank=True, null=True, verbose_name="کد پرداخت پیپینگ")
    ref_id = models.CharField(max_length=100, blank=True, null=True, verbose_name="شماره پیگیری درگاه")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', verbose_name="وضعیت")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")

    def __str__(self):
        return f"Order #{self.id} - {self.user.phone_number} - {self.status}"

    class Meta:
        verbose_name = "سفارش"
        verbose_name_plural = "سفارش‌ها"


class Subscription(models.Model):
    user = models.ForeignKey(BotUser, on_delete=models.CASCADE, related_name='subscriptions', verbose_name="کاربر")
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, verbose_name="پلن")
    start_date = models.DateTimeField(default=timezone.now, verbose_name="تاریخ شروع")
    end_date = models.DateTimeField(verbose_name="تاریخ انقضا")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    def save(self, *args, **kwargs):
        if not self.end_date:
            self.end_date = self.start_date + timedelta(days=self.plan.duration_days)
        super().save(*args, **kwargs)

    @property
    def days_remaining(self):
        remaining = (self.end_date - timezone.now()).days
        return max(0, remaining)

    def __str__(self):
        return f"اشتراک {self.plan.category.name} برای {self.user.phone_number}"

    class Meta:
        verbose_name = "اشتراک کاربر"
        verbose_name_plural = "اشتراک‌های کاربران"`
  },
  {
    path: 'store/admin.py',
    filename: 'admin.py',
    folder: 'store',
    language: 'python',
    description: 'پیکربندی پنل مدیریت جنگو با جستجو، فیلتر و لیست‌های سفارشی',
    content: `from django.contrib import admin
from .models import BotUser, ProductCategory, Plan, Order, Subscription

@admin.register(BotUser)
class BotUserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'first_name', 'phone_number', 'platform', 'created_at')
    search_fields = ('user_id', 'phone_number', 'first_name', 'username')
    list_filter = ('platform', 'created_at')

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active')

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'price', 'duration_days', 'is_active')
    list_filter = ('category', 'is_active')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'plan', 'amount', 'status', 'ref_id', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__phone_number', 'ref_id', 'payping_code')

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'start_date', 'end_date', 'is_active', 'days_remaining')
    list_filter = ('is_active', 'plan__category')
    search_fields = ('user__phone_number', 'user__first_name')`
  },
  {
    path: 'store/payping.py',
    filename: 'payping.py',
    folder: 'store',
    language: 'python',
    description: 'اتصال به وب‌سرویس PayPing جهت ساخت تراکنش و تایید نهایی',
    content: `import requests
import os

PAYPING_TOKEN = os.getenv('PAYPING_TOKEN')
BASE_URL = os.getenv('BASE_URL')

def create_payping_payment(amount_toman, order_id, user_phone, description):
    url = "https://api.payping.ir/v2/pay"
    headers = {
        "Authorization": f"Bearer {PAYPING_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "amount": amount_toman,
        "payerIdentity": user_phone or "09000000000",
        "returnUrl": f"{BASE_URL}/payment/verify/",
        "clientRefId": str(order_id),
        "description": description
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            code = response.json().get("code")
            return f"https://api.payping.ir/v2/pay/gotoipg/{code}", code
        return None, None
    except Exception as e:
        print(f"PayPing Error: {e}")
        return None, None

def verify_payping_payment(amount_toman, ref_id):
    url = "https://api.payping.ir/v2/pay/verify"
    headers = {
        "Authorization": f"Bearer {PAYPING_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "amount": amount_toman,
        "refId": ref_id
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        return response.status_code == 200
    except Exception as e:
        print(f"PayPing Verify Error: {e}")
        return False`
  },
  {
    path: 'store/views.py',
    filename: 'views.py',
    folder: 'store',
    language: 'python',
    description: 'کالبک درگاه پرداخت، ارسال پیام مستقیم به تلگرام/بله و اعلان هوشمند ادمین',
    content: `from django.http import HttpResponse
from django.shortcuts import render
from django.utils import timezone
import os
import requests
from .models import Order, Subscription
from .payping import verify_payping_payment

ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID')
TELEGRAM_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
BALE_TOKEN = os.getenv('BALE_BOT_TOKEN')

def send_bot_message(platform, chat_id, text):
    """ارسال پیام مستقیم به کاربر از طریق API پیام‌رسان مربوطه"""
    if platform == 'telegram':
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    else:
        url = f"https://tapi.bale.ai/bot{BALE_TOKEN}/sendMessage"
    
    try:
        requests.post(url, json={"chat_id": chat_id, "text": text}, timeout=5)
    except Exception as e:
        print(f"Error sending msg: {e}")

def payment_verify_view(request):
    ref_id = request.GET.get('refid') or request.POST.get('refid')
    client_ref_id = request.GET.get('clientrefid') or request.POST.get('clientrefid')
    
    if not client_ref_id or not ref_id:
        return HttpResponse("اطلاعات تراکنش نامعتبر است.", status=400)

    try:
        order = Order.objects.get(id=client_ref_id)
    except Order.DoesNotExist:
        return HttpResponse("سفارش یافت نشد.", status=404)

    if order.status == 'success':
        return HttpResponse("این سفارش قبلاً تایید شده است.")

    # تایید تراکنش با پیپینگ
    is_verified = verify_payping_payment(order.amount, ref_id)

    if is_verified:
        order.status = 'success'
        order.ref_id = ref_id
        order.save()

        # ثبت یا تمدید اشتراک
        sub, created = Subscription.objects.get_or_create(
            user=order.user,
            plan=order.plan,
            defaults={'start_date': timezone.now()}
        )
        if not created:
            # اگر از قبل اشتراک داشته، به انتهای تاریخ قبلی اضافه کن
            base_date = max(sub.end_date, timezone.now())
            sub.end_date = base_date + timezone.timedelta(days=order.plan.duration_days)
            sub.is_active = True
            sub.save()

        # ۱. پیام به کاربر
        user_msg = (
            f"✅ **پرداخت شما با موفقیت انجام شد!**\\n\\n"
            f"🔹 محصول: {order.plan.category.name}\\n"
            f"🔹 پلن: {order.plan.title}\\n"
            f"🔹 کد پیگیری: \`{ref_id}\`\\n\\n"
            f"اطلاعات شما برای ادمین ارسال شد تا دسترسی سازمانی شما فعال گردد."
        )
        send_bot_message(order.user.platform, order.user.chat_id, user_msg)

        # ۲. پیام هوشمند به ادمین (تلگرام/بله)
        admin_msg = (
            f"🚨 **خرید جدید انجام شد!**\\n\\n"
            f"👤 کاربر: {order.user.first_name}\\n"
            f"📱 شماره تماس: \`{order.user.phone_number}\`\\n"
            f"💻 پلتفرم: {order.user.platform}\\n"
            f"🛒 محصول: {order.plan.category.name} ({order.plan.title})\\n"
            f"💳 کد پیگیری درگاه: \`{ref_id}\`\\n\\n"
            f"⚡️ **اقدام ادمین:** لطفاً دسترسی سازمانی ایشان را دستی فعال کنید."
        )
        send_bot_message('telegram', ADMIN_CHAT_ID, admin_msg)

        return HttpResponse("<h1>پرداخت با موفقیت انجام شد. می‌توانید به ربات بازگردید.</h1>")
    else:
        order.status = 'failed'
        order.save()
        send_bot_message(order.user.platform, order.user.chat_id, "❌ پرداخت شما ناموفق بود یا توسط کاربر لغو شد.")
        return HttpResponse("<h1>پرداخت ناموفق بود.</h1>")`
  },
  {
    path: 'store/urls.py',
    filename: 'urls.py',
    folder: 'store',
    language: 'python',
    description: 'مسیریابی کالبک پرداخت فروشگاه',
    content: `from django.urls import path
from .views import payment_verify_view

urlpatterns = [
    path('payment/verify/', payment_verify_view, name='payment_verify'),
]`
  },
  {
    path: 'bot/bot_runner.py',
    filename: 'bot_runner.py',
    folder: 'bot',
    language: 'python',
    description: 'اجرای همزمان دو ربات تلگرام و بله با پایگاه داده مشترک، منوی اینلاین و ارسال شماره',
    content: `import os
import django
import sys
from asyncio import run, gather

# تنظیمات جنگو برای اجرا مستقل فایل ربات
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from store.models import BotUser, ProductCategory, Plan, Order, Subscription
from store.payping import create_payping_payment

TELEGRAM_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
BALE_TOKEN = os.getenv('BALE_BOT_TOKEN')

# ----------------- دکمه‌های اصلی منو -----------------
def get_main_menu():
    keyboard = [
        [InlineKeyboardButton("🛒 خرید / تمدید اشتراک", callback_data="menu_buy")],
        [InlineKeyboardButton("👤 اشتراک‌های من", callback_data="menu_my_subs")],
        [InlineKeyboardButton("📞 پشتیبانی", callback_data="menu_support")]
    ]
    return InlineKeyboardMarkup(keyboard)

# ----------------- هاندلر شروع (/start) -----------------
async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    platform = "bale" if "bale" in context.bot.base_url else "telegram"
    
    BotUser.objects.get_or_create(
        user_id=user.id,
        defaults={
            'chat_id': update.effective_chat.id,
            'platform': platform,
            'first_name': user.first_name,
            'username': user.username
        }
    )
    
    text = f"سلام {user.first_name} عزیز 👋\\nبه سیستم فروش و مدیریت اشتراک خوش آمدید.\\nلطفاً یکی از گزینه‌های زیر را انتخاب کنید:"
    if update.message:
        await update.message.reply_text(text, reply_markup=get_main_menu())
    elif update.callback_query:
        await update.callback_query.message.edit_text(text, reply_markup=get_main_menu())

# ----------------- پردازش کلیک روی دکمه‌ها -----------------
async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    user_id = query.from_user.id

    bot_user = BotUser.objects.get(user_id=user_id)

    # بازگشت به منوی اصلی
    if data == "menu_main":
        await query.message.edit_text("منوی اصلی:", reply_markup=get_main_menu())

    # دیدن اشتراک‌های من
    elif data == "menu_my_subs":
        subs = Subscription.objects.filter(user=bot_user, is_active=True)
        if not subs.exists():
            text = "❌ شما در حال حاضر هیچ اشتراک فعالی ندارید."
        else:
            text = "📋 **اشتراک‌های فعال شما:**\\n\\n"
            for s in subs:
                text += f"🔹 **{s.plan.category.name}** ({s.plan.title})\\n"
                text += f"⏱ روزهای باقیمانده: {s.days_remaining} روز\\n"
                text += f"📅 تاریخ انقضا: {s.end_date.strftime('%Y-%m-%d')}\\n--------------------\\n"
        
        keyboard = [[InlineKeyboardButton("🔙 بازگشت به منو", callback_data="menu_main")]]
        await query.message.edit_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

    # پشتیبانی
    elif data == "menu_support":
        text = "📞 **پشتیبانی سیستم**\\n\\nبرای ارتباط با پشتیبانی و طرح سوالات خود با آیدی زیر در ارتباط باشید:\\n🆔 @Admin_Support"
        keyboard = [[InlineKeyboardButton("🔙 بازگشت به منو", callback_data="menu_main")]]
        await query.message.edit_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

    # نمایش محصولات (دسته‌بندی‌ها)
    elif data == "menu_buy":
        categories = ProductCategory.objects.filter(is_active=True)
        keyboard = []
        for cat in categories:
            keyboard.append([InlineKeyboardButton(f"🤖 {cat.name}", callback_data=f"cat_{cat.id}")])
        keyboard.append([InlineKeyboardButton("🔙 بازگشت", callback_data="menu_main")])
        
        await query.message.edit_text("لطفاً محصول مورد نظر خود را انتخاب کنید:", reply_markup=InlineKeyboardMarkup(keyboard))

    # انتخاب دسته‌بندی و نمایش پلن‌ها
    elif data.startswith("cat_"):
        cat_id = data.split("_")[1]
        plans = Plan.objects.filter(category_id=cat_id, is_active=True)
        keyboard = []
        for plan in plans:
            keyboard.append([InlineKeyboardButton(f"📌 {plan.title} - {plan.price:,} تومان", callback_data=f"plan_{plan.id}")])
        keyboard.append([InlineKeyboardButton("🔙 بازگشت", callback_data="menu_buy")])
        
        await query.message.edit_text("لطفاً یکی از پلن‌های زیر را انتخاب کنید:", reply_markup=InlineKeyboardMarkup(keyboard))

    # انتخاب پلن و بررسی شماره موبایل
    elif data.startswith("plan_"):
        plan_id = data.split("_")[1]
        plan = Plan.objects.get(id=plan_id)
        
        # بررسی وجود شماره موبایل
        if not bot_user.phone_number:
            context.user_data['pending_plan_id'] = plan_id
            contact_button = KeyboardButton("📱 ارسال شماره موبایل جهت تایید", request_contact=True)
            reply_markup = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=True)
            
            await query.message.delete()
            await context.bot.send_message(
                chat_id=query.message.chat_id,
                text="⚠️ برای صدور فاکتور و ثبت اشتراک، لطفاً با لمس دکمه زیر شماره موبایل خود را به اشتراک بگذارید:",
                reply_markup=reply_markup
            )
            return

        # اگر شماره موبایل داشت، هدایت به درگاه
        await generate_payment_link(query.message, bot_user, plan, context)

# ----------------- دریافت شماره موبایل کاربر -----------------
async def contact_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact = update.message.contact
    user_id = update.effective_user.id
    bot_user = BotUser.objects.get(user_id=user_id)
    
    bot_user.phone_number = contact.phone_number
    bot_user.save()

    await update.message.reply_text("✅ شماره شما با موفقیت ثبت شد.", reply_markup=ReplyKeyboardRemove())

    plan_id = context.user_data.get('pending_plan_id')
    if plan_id:
        plan = Plan.objects.get(id=plan_id)
        await generate_payment_link(update.message, bot_user, plan, context)

# ----------------- ساخت لینک پرداخت پیپینگ -----------------
async def generate_payment_link(message, bot_user, plan, context):
    order = Order.objects.create(
        user=bot_user,
        plan=plan,
        amount=plan.price,
        status='pending'
    )

    payment_url, code = create_payping_payment(
        amount_toman=plan.price,
        order_id=order.id,
        user_phone=bot_user.phone_number,
        description=f"خرید {plan.category.name} - {plan.title}"
    )

    if payment_url:
        order.payping_code = code
        order.save()

        keyboard = [
            [InlineKeyboardButton("💳 پرداخت آنلاین (پیپینگ)", url=payment_url)],
            [InlineKeyboardButton("🔙 بازگشت به منوی اصلی", callback_data="menu_main")]
        ]
        text = (
            f"📄 **فاکتور پرداخت شما:**\\n\\n"
            f"🔹 محصول: {plan.category.name}\\n"
            f"🔹 پلن: {plan.title}\\n"
            f"💰 مبلغ قابل پرداخت: {plan.price:,} تومان\\n"
            f"📱 شماره همراه: {bot_user.phone_number}\\n\\n"
            f"لطفاً جهت تکمیل فرایند خرید روی دکمه پرداخت زیر کلیک کنید:"
        )
        await message.reply_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    else:
        await message.reply_text("❌ خطا در اتصال به درگاه پرداخت. لطفاً دقایقی دیگر مجدداً تلاش کنید.")

# ----------------- اجرای همزمان دو ربات تلگرام و بله -----------------
async def main():
    # ۱. ربات تلگرام
    app_tg = Application.builder().token(TELEGRAM_TOKEN).build()
    
    # ۲. ربات بله (با تغییر بیس آدرس API به بله)
    app_bale = Application.builder().token(BALE_TOKEN).base_url("https://tapi.bale.ai/bot").build()

    # افزودن هاندلرها به هر دو ربات
    for app in [app_tg, app_bale]:
        app.add_handler(CommandHandler("start", start_handler))
        app.add_handler(CallbackQueryHandler(callback_handler))
        app.add_handler(MessageHandler(filters.CONTACT, contact_handler))

    await gather(
        app_tg.initialize(),
        app_tg.start(),
        app_tg.updater.start_polling(),
        app_bale.initialize(),
        app_bale.start(),
        app_bale.updater.start_polling(),
    )

if __name__ == "__main__":
    run(main())`
  },
  {
    path: 'scheduler/daily_jobs.py',
    filename: 'daily_jobs.py',
    folder: 'scheduler',
    language: 'python',
    description: 'بررسی روزانه انقضای اشتراک‌ها: یادآوری ۵ روزه، هشدار ۳ روزه، اتمام و اخطار ۲ روزه قطع دسترسی به ادمین',
    content: `import os
import django
import sys
from datetime import timedelta
import requests

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from store.models import Subscription
from store.views import send_bot_message

ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID')

def run_daily_expiration_checks():
    now = timezone.now()
    today_date = now.date()

    active_subs = Subscription.objects.filter(is_active=True)

    for sub in active_subs:
        days_left = (sub.end_date.date() - today_date).days

        # ۱. پنج روز مانده به انقضا
        if days_left == 5:
            msg = f"⏳ **یادآوری تمدید اشتراک**\\n\\nاشتراک {sub.plan.category.name} شما ۵ روز دیگر به پایان می‌رسد."
            send_bot_message(sub.user.platform, sub.user.chat_id, msg)
            
            admin_msg = f"🔔 **یادآوری ۵ روز:** اشتراک کاربر {sub.user.first_name} ({sub.user.phone_number}) ۵ روز دیگر تمام می‌شود."
            send_bot_message('telegram', ADMIN_CHAT_ID, admin_msg)

        # ۲. سه روز مانده به انقضا
        elif days_left == 3:
            msg = f"⚠️ **هشدار تمدید اشتراک**\\n\\nاشتراک {sub.plan.category.name} شما ۳ روز دیگر به پایان می‌رسد. لطفاً اقدام به تمدید کنید."
            send_bot_message(sub.user.platform, sub.user.chat_id, msg)

        # ۳. روز اتمام اشتراک (امروز)
        elif days_left <= 0:
            sub.is_active = False
            sub.save()
            msg = f"❌ **اتمام اشتراک**\\n\\nاشتراک {sub.plan.category.name} شما به پایان رسید."
            send_bot_message(sub.user.platform, sub.user.chat_id, msg)

    # ۴. بررسی ۲ روز پس از اتمام (عدم تمدید)
    two_days_ago = now - timedelta(days=2)
    expired_subs = Subscription.objects.filter(
        is_active=False,
        end_date__date=two_days_ago.date()
    )

    for sub in expired_subs:
        # بررسی اینکه آیا اشتراک جدیدی نخریده باشد
        has_new_sub = Subscription.objects.filter(
            user=sub.user,
            plan__category=sub.plan.category,
            is_active=True
        ).exists()

        if not has_new_sub:
            admin_alert = (
                f"🛑 **هشدار قطع دسترسی دستی**\\n\\n"
                f"اشتراک کاربر: {sub.user.first_name}\\n"
                f"شماره تماس: \`{sub.user.phone_number}\`\\n"
                f"محصول: {sub.plan.category.name}\\n\\n"
                f"⚠️ این کاربر ۲ روز است که اشتراک خود را تمدید نکرده است. **لطفاً دسترسی سازمانی ایشان را دستی قطع کنید.**"
            )
            send_bot_message('telegram', ADMIN_CHAT_ID, admin_alert)

if __name__ == "__main__":
    run_daily_expiration_checks()`
  },
  {
    path: 'README.md',
    filename: 'README.md',
    folder: 'Root',
    language: 'markdown',
    description: 'راهنمای گام‌به‌گام و بسیار ساده راه‌اندازی از صفر تا صد + دریافت توکن درگاه پی‌پینگ',
    content: `# 🚀 راهنمای راه‌اندازی صفر تا صد سیستم فروش اشتراک هوش مصنوعی
## (ربات تلگرام و بله + پنل مدیریت جنگو + درگاه پرداخت شاپرک پی‌پینگ + کرون‌جاب روزانه)

این راهنما برای این نوشته شده که حتی اگر تجربه‌ی زیادی با سرور و پایتون ندارید، بتوانید به ساده‌ترین روش ممکن پروژه را در **لپ‌تاپ** (جهت تست) یا **سرور مجازی (VPS)** راه بیندازید.

---

## 📌 بخش اول: نحوه دریافت توکن و اتصال درگاه پی‌پینگ (PayPing)

شما برای اینکه پول به حساب بانکی‌تان بیاید، نیاز به یک **توکن (Token)** از پی‌پینگ دارید. پی‌پینگ لینک پرداخت ثابت ندارد؛ بلکه با این توکن، برای هر مشتری به صورت خودکار یک لینک امن بانکی اختصاصی ساخته می‌شود.

### مراحل دریافت توکن در پنل پی‌پینگ:
1. وارد سایت [payping.ir](https://payping.ir) شوید و به پنل کاربری‌تان بروید.
2. از منوی سمت راست روی **«درگاه‌های پرداخت»** یا **«توسعه‌دهندگان» (Developers)** کلیک کنید.
3. بخش **«توکن‌ها» (API Tokens) / «کلیدهای احراز هویت»** را باز کنید.
4. روی **«ایجاد توکن جدید»** کلیک کنید:
   - یک عنوان دلخواه بدهید (مثلاً: \`AI Bot Store\`).
   - سطح دسترسی ساخت پرداخت و اعتبارسنجی (Create Payment & Verify) را تیک بزنید.
5. یک عبارت طولانی (شامل اعداد و حروف انگلیسی) به شما نمایش داده می‌شود. **آن را کپی کنید**. این همان \`PAYPING_TOKEN\` شماست!
6. در بخش تنظیمات درگاه/سرویس، آدرس بازگشت پیش‌فرض (Callback) را برابر با آدرس سرور خود قرار دهید:
   \`https://your-domain.com/payment/verify/\`
   *(اگر روی لپ‌تاپ هستید، از آدرس Ngrok طبق بخش بعدی استفاده کنید).*

---

## 📌 بخش دوم: آماده‌سازی توکن ربات‌های تلگرام و بله

### ۱. ربات تلگرام:
1. در تلگرام به آیدی **@BotFather** پیام دهید و دستور \`/newbot\` را بزنید.
2. نام و آیدی رباتتان را انتخاب کنید.
3. توکنی شبیه به \`7123456789:AAHq_...\` دریافت می‌کنید. آن را کپی کنید.

### ۲. ربات بله:
1. در پیام‌رسان بله بازوی **BotFather** را جستجو کنید.
2. ربات جدید بسازید و توکن را کپی کنید.

### ۳. چت‌آیدی ادمین (برای دریافت اعلان‌های خرید و هشدارها):
1. در تلگرام به ربات **@userinfobot** پیام دهید تا عدد \`Id\` شما را بگوید (مثلاً \`123456789\`).

---

## 📌 بخش سوم: راه‌اندازی و تست روی لپ‌تاپ (ساده‌ترین روش)

### مرحله ۱: باز کردن پروژه
پروژه را که با دکمه **«دانلود سورس‌کد ZIP»** دریافت کرده‌اید از حالت فشرده خارج (Extract) کنید و در ترمینال یا CMD وارد آن پوشه شوید:
\`\`\`bash
cd subscription_project
\`\`\`

### مرحله ۲: ساخت محیط مجازی پایتون
\`\`\`bash
# ساخت محیط مجازی
python -m venv venv

# فعال‌سازی در ویندوز:
venv\\Scripts\\activate

# فعال‌سازی در مک یا لینوکس:
source venv/bin/activate
\`\`\`

### مرحله ۳: نصب کتابخانه‌ها
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### مرحله ۴: تنظیم فایل .env
فایل \`.env\` موجود در پوشه را با یک ویرایشگر متن (مثل Notepad یا VSCode) باز کنید و مقادیر بالا را جایگزین کنید:
\`\`\`env
SECRET_KEY=django-insecure-my-custom-key-12345
DEBUG=True

# توکن‌های شما:
TELEGRAM_BOT_TOKEN=توکن_تلگرام_اینجا
BALE_BOT_TOKEN=توکن_بله_اینجا
ADMIN_CHAT_ID=چت_آیدی_عددی_ادمین_اینجا

# تنظیمات پی‌پینگ:
PAYPING_TOKEN=توکن_پی‌پینگ_که_از_سایت_گرفتید
PAYPING_GOTO_URL=https://api.payping.ir/v2/pay/gotoipg/
BASE_URL=https://your-ngrok-domain.ngrok-free.app
\`\`\`

### مرحله ۵: ساخت جداول پایگاه داده و ادمین جنگو
دستورات زیر را بترتیب اجرا کنید:
\`\`\`bash
python manage.py migrate
python manage.py createsuperuser
\`\`\`
*(یک نام کاربری و پسورد برای ورود به پنل ادمین وارد کنید).*

### مرحله ۶: دریافت آدرس اینترنتی برای لپ‌تاپ (با Ngrok رایگان)
برای اینکه کاربر بعد از پرداخت در درگاه شاپرک به درستی به لپ‌تاپ شما وصل شود:
1. نرم‌افزار [ngrok.com](https://ngrok.com) را دانلود کنید.
2. در یک ترمینال جداگانه دستور زیر را بزنید:
\`\`\`bash
ngrok http 8000
\`\`\`
3. لینکی شبیه به \`https://abc1234.ngrok-free.app\` به شما داده می‌شود.
4. این لینک را کپی کنید و در فایل \`.env\` جلوی \`BASE_URL\` بگذارید.

### مرحله ۷: اجرای سرور وب و ربات‌ها
- **ترمینال اول (سرور جنگو):**
\`\`\`bash
python manage.py runserver 0.0.0.0:8000
\`\`\`
حالا در مرورگر به \`http://127.0.0.1:8000/admin\` بروید و وارد شوید. از بخش دسته‌بندی محصولات و پلن‌ها، بسته‌های خود را تعریف کنید.

- **ترمینال دوم (ربات‌ها):**
\`\`\`bash
python bot/bot_runner.py
\`\`\`
هر دو ربات تلگرام و بله آنلاین می‌شوند و به محض زدن \`/start\` منوی خرید را با درگاه پی‌پینگ فعال ارائه می‌دهند!

---

## 📌 بخش چهارم: استقرار نهایی روی سرور مجازی (VPS)

روی سرور مجازی لینوکسی (Ubuntu):
1. پایتون و pip را نصب کنید (\`sudo apt update && sudo apt install python3-pip python3-venv\`).
2. فایل‌های پروژه را روی سرور آپلود کنید.
3. مراحل ساخت venv و نصب requirements را طبق بالا انجام دهید.
4. آدرس دامین یا IP سرور خود را در \`BASE_URL\` قرار دهید.
5. برای اینکه ربات و جنگو همیشه روشن بمانند از ابزار ساده‌ی \`tmux\` یا \`systemd\` یا \`supervisor\` استفاده کنید.

### تنظیم کرون‌جاب روزانه (بررسی خودکار انقضا ساعت ۱۰ صبح):
دستور زیر را در ترمینال سرور بزنید:
\`\`\`bash
crontab -e
\`\`\`
سپس این خط را در انتهای فایل اضافه کنید:
\`\`\`cron
0 10 * * * /root/subscription_project/venv/bin/python /root/subscription_project/scheduler/daily_jobs.py >> /var/log/cron_subs.log 2>&1
\`\`\`

با این کار:
- ۵ روز مانده به پایان اشتراک: پیام یادآوری برای مشتری و هشدار برای ادمین ارسال می‌شود.
- ۳ روز مانده: اخطار تمدید به مشتری ارسال می‌شود.
- روز اتمام: وضعیت اشتراک در دیتابیس به \`غیرفعال\` تغییر می‌کند.
- ۲ روز بعد از اتمام: اخطار قرمز فوری برای ادمین ارسال می‌شود تا دسترسی سازمانی او دستی قطع گردد.
`
  }
];
