import React, { useState } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Play, 
  RotateCcw, 
  Terminal, 
  Calendar, 
  Send, 
  Bot,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Subscription, BotUser, Plan, ProductCategory, CronLog } from '../types';

interface SchedulerViewProps {
  subscriptions: Subscription[];
  users: BotUser[];
  plans: Plan[];
  categories: ProductCategory[];
  cronLogs: CronLog[];
  onRunDailyCron: () => void;
  onAdvanceDays: (days: number) => void;
  simulationDayOffset: number;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({
  subscriptions,
  users,
  plans,
  categories,
  cronLogs,
  onRunDailyCron,
  onAdvanceDays,
  simulationDayOffset
}) => {
  const [activeRuleTab, setActiveRuleTab] = useState<number>(0);

  const rules = [
    {
      id: 1,
      title: '۱. یادآوری ۵ روزه',
      targetDays: 5,
      badge: '۵ روز مانده',
      color: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
      description: 'ارسال یادآوری به کاربر و اطلاع‌رسانی به ادمین جهت پیگیری تمدید زودهنگام',
      actionUser: '⏳ یادآوری تمدید اشتراک: ۵ روز دیگر به پایان می‌رسد.',
      actionAdmin: '🔔 یادآوری ۵ روز: اشتراک کاربر تا ۵ روز دیگر به اتمام می‌رسد.'
    },
    {
      id: 2,
      title: '۲. هشدار ۳ روزه',
      targetDays: 3,
      badge: '۳ روز مانده',
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/15',
      description: 'ارسال پیام با اولویت بالا به کاربر با هشدار مهلت کوتاه باقی‌مانده',
      actionUser: '⚠️ هشدار تمدید اشتراک: ۳ روز دیگر تمام می‌شود. لطفاً اقدام به تمدید کنید.',
      actionAdmin: 'عدم ارسال (فقط کاربر مطلع می‌شود)'
    },
    {
      id: 3,
      title: '۳. اتمام اشتراک (امروز)',
      targetDays: 0,
      badge: 'روز اتمام',
      color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      description: 'تغییر خودکار وضعیت اشتراک به is_active=False در دیتابیس جنگو و پیام اتمام به کاربر',
      actionUser: '❌ اتمام اشتراک: اشتراک سرویس شما به پایان رسید.',
      actionAdmin: 'به‌روزرسانی خودکار در دیتابیس'
    },
    {
      id: 4,
      title: '۴. هشدار ۲ روز پس از انقضا',
      targetDays: -2,
      badge: '۲ روز پس از انقضا',
      color: 'text-rose-500 border-rose-600/50 bg-rose-600/20 font-bold',
      description: 'بررسی عدم خرید مجدد و ارسال اخطار فوری قرمز رنگ به ادمین جهت قطع دسترسی سازمانی',
      actionUser: '—',
      actionAdmin: '🛑 هشدار قطع دسترسی دستی: کاربر ۲ روز است تمدید نکرده، لطفاً دسترسی ایشان را دستی قطع کنید.'
    }
  ];

  const now = new Date();
  now.setDate(now.getDate() + simulationDayOffset);

  return (
    <div className="space-y-6">
      {/* Top Banner with Simulation Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20 mb-2">
              <Terminal className="w-3.5 h-3.5" />
              scheduler / daily_jobs.py • APScheduler & Linux Crontab
            </div>
            <h2 className="text-xl font-bold text-white">
              موتور هوشمند زمان‌بندی و پایش خودکار انقضای اشتراک‌ها
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              این اسکریپت در سرور واقعی هر روز راس ساعت ۱۰ صبح توسط Crontab یا APScheduler اجرا می‌شود و جدول اشتراک‌ها را بررسی نموده و رویدادهای لازم را برای کاربر و ادمین به صورت مستقیم مخابره می‌کند.
            </p>
          </div>

          {/* Trigger Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRunDailyCron}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer transition"
            >
              <Play className="w-4 h-4 fill-white" />
              اجرای دستی کرون‌جاب (Run Now)
            </button>

            <button
              onClick={() => onAdvanceDays(1)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs cursor-pointer transition"
              title="جلو بردن شبیه‌ساز به اندازه ۱ روز"
            >
              +۱ روز بعد
            </button>

            <button
              onClick={() => onAdvanceDays(3)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs cursor-pointer transition"
              title="جلو بردن شبیه‌ساز به اندازه ۳ روز"
            >
              +۳ روز بعد
            </button>

            {simulationDayOffset > 0 && (
              <button
                onClick={() => onAdvanceDays(-simulationDayOffset)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer transition"
                title="بازگشت به تاریخ امروز"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Current Date Offset Indicator */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span>تاریخ مبنای اجرای تست:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {now.toLocaleDateString('fa-IR')}
            </span>
            {simulationDayOffset > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                (+{simulationDayOffset} روز جلوتر)
              </span>
            )}
          </div>
          <span className="text-slate-500 font-mono text-[11px]">
            Timezone: Asia/Tehran
          </span>
        </div>
      </div>

      {/* 4 Execution Rules Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rules.map((r, idx) => (
          <div
            key={r.id}
            className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${r.color}`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">{r.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-950/40">
                  {r.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-300/90 leading-relaxed">
                {r.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/50 space-y-1 text-[10px]">
              <div>
                <span className="text-slate-400">پیام کاربر: </span>
                <span className="text-slate-200">{r.actionUser}</span>
              </div>
              <div>
                <span className="text-slate-400">اعلان ادمین: </span>
                <span className="text-slate-200">{r.actionAdmin}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cron Logs History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            لاگ اجرای زنده کرون‌جاب (Scheduler Execution Logs)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            تعداد رویدادها: {cronLogs.length}
          </span>
        </div>

        <div className="border border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">زمان اجرا</th>
                <th className="py-3 px-4">کاربر و شماره تماس</th>
                <th className="py-3 px-4">محصول</th>
                <th className="py-3 px-4">روزهای باقیمانده</th>
                <th className="py-3 px-4">نوع عملیات هوشمند</th>
                <th className="py-3 px-4">متن ارسال شده به پیام‌رسان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cronLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    هنوز عملیات کرون‌جابی ثبت نشده است. دکمه "اجرای دستی کرون‌جاب" را بفشارید تا لاگ‌ها ثبت شوند.
                  </td>
                </tr>
              ) : (
                cronLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{log.user_name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{log.user_phone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {log.category_name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {log.days_left === 5 && <span className="text-amber-300">۵ روز</span>}
                      {log.days_left === 3 && <span className="text-amber-400">۳ روز</span>}
                      {log.days_left <= 0 && log.days_left > -2 && <span className="text-rose-400">۰ روز (منقضی)</span>}
                      {log.days_left <= -2 && <span className="text-rose-500 font-bold">-۲ روز (قطع دسترسی)</span>}
                    </td>
                    <td className="py-3 px-4">
                      {log.action_type === '5_days_left' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                          یادآوری ۵ روزه
                        </span>
                      )}
                      {log.action_type === '3_days_left' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                          هشدار ۳ روزه
                        </span>
                      )}
                      {log.action_type === 'expired_today' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                          اتمام اشتراک (امروز)
                        </span>
                      )}
                      {log.action_type === '2_days_overdue_alert' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                          🛑 اخطار ادمین: قطع دسترسی
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px] max-w-md font-sans leading-relaxed">
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
