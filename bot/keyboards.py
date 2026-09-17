from telebot import types
import json
from database import get_db, Setting

def get_db_setting(key: str, default: str = "") -> str:
    with get_db() as db:
        s = db.query(Setting).filter_by(key=key).first()
        return s.value if s else default

def main_keyboard():
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    markup.add(types.KeyboardButton("💎 خرید اشتراک"), types.KeyboardButton("📋 تعرفه‌ها و پلن‌ها"))
    card_enabled = get_db_setting("card_payment_enabled", "true").lower() in ("true", "1")
    if card_enabled:
        markup.add(types.KeyboardButton("💳 شماره کارت واریز"), types.KeyboardButton("👤 وضعیت اشتراک من"))
    else:
        markup.add(types.KeyboardButton("👤 وضعیت اشتراک من"))
    markup.add(types.KeyboardButton("📞 پشتیبانی"))
    return markup

def plans_inline_keyboard(plans_dict: dict):
    markup = types.InlineKeyboardMarkup(row_width=1)
    for key, p in plans_dict.items():
        btn = types.InlineKeyboardButton(
            f"🛒 {p['name']} - {int(p['price']):,} تومان",
            callback_data=f"select_{key}"
        )
        markup.add(btn)
    return markup
