import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Shield, 
  Globe, 
  Send, 
  Bot, 
  CreditCard, 
  Check, 
  Copy, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ProjectSettings } from '../types';

interface SettingsViewProps {
  settings: ProjectSettings;
  onUpdateSettings: (newSettings: ProjectSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [form, setForm] = useState<ProjectSettings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (field: keyof ProjectSettings, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const envFileContent = `SECRET_KEY=${form.secretKey}
DEBUG=${form.debug ? 'True' : 'False'}

# Bot Tokens
TELEGRAM_BOT_TOKEN=${form.telegramBotToken}
BALE_BOT_TOKEN=${form.baleBotToken}
ADMIN_CHAT_ID=${form.adminChatId}  # چت آیدی ادمین جهت دریافت اعلان‌ها

# PayPing Settings
PAYPING_TOKEN=${form.paypingToken}
PAYPING_GOTO_URL=${form.paypingGotoUrl}
BASE_URL=${form.baseUrl}  # آدرس دامین یا انگرک برای کالبک درگاه`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envFileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
          <Key className="w-3.5 h-3.5" />
          تنظیمات محیطی (.env) و کلیدهای ارتباطی
        </div>
        <h2 className="text-xl font-bold text-white">
          پیکربندی توکن‌های پیام‌رسان‌ها و درگاه بانکی پی‌پینگ
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          این متغیرها در فایل <code className="font-mono text-sky-400">.env</code> ریشه پروژه ذخیره شده و توسط کتابخانه <code className="font-mono text-slate-300">python-dotenv</code> در کدهای جنگو و ربات خوانده می‌شوند.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Telegram Token */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-slate-200 font-bold">
              <Send className="w-4 h-4 text-sky-400" />
              توکن ربات تلگرام (TELEGRAM_BOT_TOKEN):
            </label>
            <input
              type="text"
              value={form.telegramBotToken}
              onChange={e => handleChange('telegramBotToken', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-sky-500"
              dir="ltr"
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
            />
            <p className="text-[11px] text-slate-400">
              دریافت شده از @BotFather در تلگرام
            </p>
          </div>

          {/* Bale Token */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-slate-200 font-bold">
              <Bot className="w-4 h-4 text-teal-400" />
              توکن ربات بله (BALE_BOT_TOKEN):
            </label>
            <input
              type="text"
              value={form.baleBotToken}
              onChange={e => handleChange('baleBotToken', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-teal-500"
              dir="ltr"
              placeholder="987654321:XYZabcDef..."
            />
            <p className="text-[11px] text-slate-400">
              دریافت شده از بازوی BotFather در پیام‌رسان بله
            </p>
          </div>

          {/* Admin Chat ID */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-slate-200 font-bold">
              <Shield className="w-4 h-4 text-amber-400" />
              چت آیدی ادمین (ADMIN_CHAT_ID):
            </label>
            <input
              type="text"
              value={form.adminChatId}
              onChange={e => handleChange('adminChatId', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-amber-500"
              dir="ltr"
              placeholder="123456789"
            />
            <p className="text-[11px] text-slate-400">
              چت آیدی عددی ادمین جهت دریافت اعلان‌های فوری خرید و هشدارهای قطع دسترسی
            </p>
          </div>

          {/* PayPing Token */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-slate-200 font-bold">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              توکن درگاه پیپینگ (PAYPING_TOKEN):
            </label>
            <input
              type="text"
              value={form.paypingToken}
              onChange={e => handleChange('paypingToken', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
              dir="ltr"
              placeholder="Bearer Token پیپینگ..."
            />
            <p className="text-[11px] text-slate-400">
              توکن احراز هویت توکن‌بیس پیپینگ (Bearer)
            </p>
          </div>

          {/* Base URL */}
          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-slate-200 font-bold">
              <Globe className="w-4 h-4 text-indigo-400" />
              آدرس دامین یا انگرک سرور جنگو (BASE_URL):
            </label>
            <input
              type="text"
              value={form.baseUrl}
              onChange={e => handleChange('baseUrl', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
              dir="ltr"
              placeholder="https://your-ngrok-domain.ngrok-free.app"
            />
            <p className="text-[11px] text-slate-400">
              آدرس سرور جهت کالبک بازگشت از درگاه (returnUrl: /payment/verify/)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer transition"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Settings className="w-4 h-4" />}
            <span>{saved ? 'تنظیمات ذخیره شد!' : 'ذخیره تنظیمات'}</span>
          </button>
        </div>
      </form>

      {/* PayPing Step-by-Step Guide Card */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <span>راهنمای مرحله‌به‌مرحله دریافت توکن و نحوه کارکرد لینک درگاه پی‌پینگ</span>
        </div>

        <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">1</span>
              ورود به پنل پی‌پینگ و دریافت توکن دسترسی (Bearer Token)
            </h4>
            <p className="text-slate-400 text-[11px]">
              ۱. وارد سایت <a href="https://payping.ir" target="_blank" rel="noreferrer" className="text-emerald-400 underline">payping.ir</a> و پنل کاربری خود شوید.<br />
              ۲. از منوی سمت راست وارد <strong>«توسعه‌دهندگان» (Developers)</strong> یا <strong>«توکن‌ها» (API Tokens)</strong> شوید.<br />
              ۳. روی <strong>«ایجاد توکن جدید»</strong> کلیک کنید، عنوان را مثلاً <code className="text-emerald-300">AI Subscription Bot</code> بگذارید و تیک دسترسی ساخت پرداخت و اعتبارسنجی را فعال کنید.<br />
              ۴. کلید رمزنگاری شده‌ی بلندی که به شما داده می‌شود را کپی کرده و در فیلد <strong>PAYPING_TOKEN</strong> بالا قرار دهید.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">2</span>
              لینک درگاه پرداخت چگونه ساخته می‌شود؟
            </h4>
            <p className="text-slate-400 text-[11px]">
              توجه داشته باشید که درگاه‌های شاپرک مانند پی‌پینگ <strong>لینک پرداخت ثابت ندارند</strong>. بلکه وقتی مشتری در تلگرام یا بله روی یک پلن کلیک می‌کند، سیستم به صورت آنی به سرور پی‌پینگ پیام می‌زند:
              <br />
              <code className="text-sky-300 font-mono block mt-1 bg-slate-900 p-2 rounded border border-slate-800" dir="ltr">
                POST https://api.payping.ir/v2/pay &rarr; دریافت کد یکتا (Code) &rarr; ساخت لینک: https://api.payping.ir/v2/pay/gotoipg/CODE
              </code>
              این لینک به عنوان دکمه شیشه‌ای <strong>«پرداخت آنلاین 💳»</strong> مستقیماً در تلگرام/بله برای همان مشتری باز می‌شود.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">3</span>
              آدرس بازگشت (Callback / ReturnUrl)
            </h4>
            <p className="text-slate-400 text-[11px]">
              وقتی خریدار پرداخت را در شاپرک انجام می‌دهد، پی‌پینگ خریدار را به آدرس زیر بازمی‌گرداند:<br />
              <code className="text-amber-300 font-mono" dir="ltr">{form.baseUrl}/payment/verify/</code><br />
              سرور جنگو کد تراکنش را با توکن پی‌پینگ تطبیق داده، رسید دیجیتال دریافت می‌کند، اشتراک کاربر را بلافاصله فعال ساخته و در تلگرام/بله رسید را برای مشتری و پیام اعلان را برای شما (ادمین) ارسال می‌کند.
            </p>
          </div>
        </div>
      </div>

      {/* Generated .env Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            پیش‌نمایش محتوای فایل .env نهایی:
          </div>
          <button
            onClick={copyEnv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'کپی شد' : 'کپی محتوا'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed" dir="ltr">
          {envFileContent}
        </pre>
      </div>
    </div>
  );
};
