import React from 'react';
import { 
  DollarSign, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Bot, 
  Send, 
  CreditCard, 
  Sparkles, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { BotUser, ProductCategory, Plan, Order, Subscription, SystemNotification } from '../types';

interface DashboardViewProps {
  users: BotUser[];
  categories: ProductCategory[];
  plans: Plan[];
  orders: Order[];
  subscriptions: Subscription[];
  notifications: SystemNotification[];
  onNavigate: (tab: string) => void;
  onTriggerDailyCron: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  users,
  categories,
  plans,
  orders,
  subscriptions,
  notifications,
  onNavigate,
  onTriggerDailyCron
}) => {
  // Calculations
  const successfulOrders = orders.filter(o => o.status === 'success');
  const totalRevenue = successfulOrders.reduce((acc, curr) => acc + curr.amount, 0);

  const activeSubscriptions = subscriptions.filter(s => s.is_active);
  const now = new Date();
  
  const expiringSoonCount = activeSubscriptions.filter(s => {
    const end = new Date(s.end_date);
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return days <= 5 && days > 0;
  }).length;

  const expiredCount = subscriptions.filter(s => {
    const end = new Date(s.end_date);
    return end < now || !s.is_active;
  }).length;

  const telegramUsers = users.filter(u => u.platform === 'telegram').length;
  const baleUsers = users.filter(u => u.platform === 'bale').length;

  // Format currency
  const formatToman = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/20 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              پایگاه داده مشترک تلگرام و بله متصل و آماده است
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              سامانه یکپارچه فروش و تمدید اشتراک هوش مصنوعی
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              مدیریت اشتراک‌های تجاری ChatGPT و Gemini به همراه ربات‌های خودکار تلگرام و پیام‌رسان بله، درگاه مستقیم PayPing، صدور فاکتور لحظه‌ای و سیستم هشدار انقضای ۴ مرحله‌ای برای ادمین و کاربران.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('bot')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              تست زنده ربات (تلگرام / بله)
            </button>
            <button
              onClick={onTriggerDailyCron}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              اجرای کرون‌جاب بررسی انقضا
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">مجموع درآمد پرداختی</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatToman(totalRevenue)}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">
              {successfulOrders.length}
            </span>
            تراکنش موفق در درگاه پیپینگ
          </div>
        </div>

        {/* Metric 2: Active Subscriptions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">اشتراک‌های فعال</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {activeSubscriptions.length} <span className="text-sm font-normal text-slate-400">اشتراک فعال</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-amber-400 font-medium">{expiringSoonCount} اشتراک</span>
            نزدیک به انقضا (زیر ۵ روز)
          </div>
        </div>

        {/* Metric 3: Bot Users */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">کاربران ربات پیام‌رسان</span>
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {users.length} <span className="text-sm font-normal text-slate-400">کاربر یکتا</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="text-sky-400 font-medium flex items-center gap-1">
              <Send className="w-3 h-3" /> {telegramUsers} تلگرام
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-teal-400 font-medium flex items-center gap-1">
              <Bot className="w-3 h-3" /> {baleUsers} بله
            </span>
          </div>
        </div>

        {/* Metric 4: Expired & Alerts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">انقضا و هشدار قطع دستی</span>
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {expiredCount} <span className="text-sm font-normal text-rose-400">منقضی شده</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            اقدام روز دوم: اعلام در چت تلگرام ادمین
          </div>
        </div>
      </div>

      {/* Main Content Grid: Categories & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Product Categories & Active Plans */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                دسته‌بندی‌ها و پلن‌های تعریف شده در جنگو (store/models.py)
              </h3>
              <button
                onClick={() => onNavigate('django')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                مدیریت در پنل جنگو
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const catPlans = plans.filter(p => p.category_id === cat.id);
                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {cat.name.includes('ChatGPT') ? '🤖' : cat.name.includes('Gemini') ? '💎' : cat.name.includes('Claude') ? '🧠' : '🎨'}
                        </div>
                        <span className="font-bold text-white text-sm">{cat.name}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        cat.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {cat.is_active ? 'فعال در ربات' : 'غیرفعال'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {cat.description || 'اکانت تجاری هوش مصنوعی با دسترسی پایدار'}
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="text-[11px] text-slate-400 font-medium">پلن‌های موجود ({catPlans.length} پلن):</div>
                      <div className="space-y-1">
                        {catPlans.map(plan => (
                          <div key={plan.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/80 border border-slate-800/60">
                            <span className="text-slate-300">{plan.title}</span>
                            <span className="font-mono text-emerald-400 font-semibold">{formatToman(plan.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscriptions Timeline Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                وضعیت لحظه‌ای اشتراک کاربران و روزهای باقیمانده
              </h3>
              <button
                onClick={() => onNavigate('scheduler')}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                بررسی لاگ کرون‌جاب
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 pb-2">
                    <th className="py-2.5 px-3">کاربر</th>
                    <th className="py-2.5 px-3">پیام‌رسان</th>
                    <th className="py-2.5 px-3">محصول و پلن</th>
                    <th className="py-2.5 px-3">تاریخ انقضا</th>
                    <th className="py-2.5 px-3">مهلت باقیمانده</th>
                    <th className="py-2.5 px-3 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {subscriptions.map(sub => {
                    const user = users.find(u => u.id === sub.user_id);
                    const plan = plans.find(p => p.id === sub.plan_id);
                    const category = categories.find(c => c.id === plan?.category_id);

                    const endDate = new Date(sub.end_date);
                    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));
                    const isExpired = daysRemaining <= 0 || !sub.is_active;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200">{user?.first_name || 'کاربر'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{user?.phone_number || 'بدون شماره'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            user?.platform === 'telegram'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          }`}>
                            {user?.platform === 'telegram' ? 'تلگرام' : 'بله'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-200 font-medium">{category?.name}</span>
                          <div className="text-[11px] text-slate-400">{plan?.title}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {endDate.toLocaleDateString('fa-IR')}
                        </td>
                        <td className="py-3 px-3 font-medium">
                          {isExpired ? (
                            <span className="text-rose-400">منقضی شده</span>
                          ) : daysRemaining <= 3 ? (
                            <span className="text-amber-400 font-bold">{daysRemaining} روز (هشدار ۳ روزه)</span>
                          ) : daysRemaining <= 5 ? (
                            <span className="text-amber-300 font-bold">{daysRemaining} روز (یادآوری ۵ روزه)</span>
                          ) : (
                            <span className="text-emerald-400">{daysRemaining} روز</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            sub.is_active && !isExpired
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {sub.is_active && !isExpired ? 'دسترسی فعال' : 'قطع دسترسی'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Notification Feed & Flow Summary */}
        <div className="space-y-6">
          {/* Notifications Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                پیام‌ها و اعلان‌های هوشمند سیستم
              </h3>
              <span className="text-[11px] text-slate-400">زنده</span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  پیامی تاکنون ثبت نشده است. با ارسال سفارش یا اجرای کرون‌جاب پیام‌ها نمایش داده می‌شوند.
                </div>
              ) : (
                notifications.slice(0, 8).map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border text-xs leading-relaxed space-y-1.5 ${
                      notif.recipient_type === 'admin'
                        ? 'bg-amber-950/20 border-amber-600/30 text-amber-200'
                        : 'bg-slate-950/70 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium opacity-80">
                      <span className="flex items-center gap-1.5">
                        {notif.recipient_type === 'admin' ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            اعلان به ادمین ({ADMIN_CHAT_ID_LABEL})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
                            پیام به کاربر ({notif.platform === 'telegram' ? 'تلگرام' : 'بله'})
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-slate-400">
                        {new Date(notif.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="whitespace-pre-line text-xs font-sans">
                      {notif.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Architecture summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              مراحل چرخه فروش و تایید خودکار:
            </h4>
            <ol className="text-xs text-slate-300 space-y-2 leading-relaxed list-decimal list-inside pr-1">
              <li>کاربر در ربات تلگرام یا بله دستور <code className="bg-slate-800 px-1 py-0.5 rounded text-sky-400 font-mono">/start</code> را ارسال می‌کند.</li>
              <li>محصول و پلن را از طریق منوی شیشه‌ای (Inline) انتخاب می‌کند.</li>
              <li>در صورت عدم وجود شماره، با کلیک روی <span className="text-emerald-400 font-medium">ارسال شماره</span> احراز هویت می‌شود.</li>
              <li>فاکتور PayPing صادر و به صفحه پرداخت هدایت می‌گردد.</li>
              <li>پس از تایید درگاه، اشتراک تمدید شده و همزمان به کاربر و ادمین اعلان ارسال می‌شود.</li>
              <li>کرون‌جاب هوشمند روزانه در ۵ روز، ۳ روز، انقضا و ۲ روز پس از انقضا یادآوری می‌کند.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

const ADMIN_CHAT_ID_LABEL = 'ADMIN_CHAT_ID';
