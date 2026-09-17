import React from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Clock, 
  Code2, 
  LayoutDashboard, 
  CreditCard, 
  Settings, 
  Download,
  Terminal,
  FileDown
} from 'lucide-react';
import { downloadReadmeAsWordDoc } from '../utils/wordExport';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadZip: () => void;
  pendingOrdersCount: number;
  expiringCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadZip,
  pendingOrdersCount,
  expiringCount
}) => {
  const tabs = [
    { id: 'simplebot', label: 'ربات آسان پایتون (تک‌فایل)', icon: Sparkles, badge: 'پیشنهادی' },
    { id: 'django', label: 'مدیریت آنلاین (بدون نرم‌افزار)', icon: ShieldCheck, badgeCount: pendingOrdersCount },
    { id: 'bot', label: 'شبیه‌ساز و تست زنده', icon: Bot, badge: 'زنده' },
    { id: 'dashboard', label: 'آمار و وضعیت', icon: LayoutDashboard },
    { id: 'code', label: 'کدهای پایتون و فایل‌ها', icon: Code2 },
    { id: 'scheduler', label: 'یادآور انقضا (کرون‌جاب)', icon: Clock, badgeCount: expiringCount },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Top status bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 border-b border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            جنگو ۴.۲ (Active)
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <Send className="w-3 h-3" />
            تلگرام Bot API (Polling)
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            پیام‌رسان بله (tapi.bale.ai)
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <CreditCard className="w-3 h-3" />
            درگاه PayPing (v2/pay)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadReadmeAsWordDoc}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 transition cursor-pointer font-medium text-xs"
            title="دانلود مستقیم راهنمای گام‌به‌گام با فرمت فایل Word (.doc)"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-400" />
            دانلود راهنما (فایل Word)
          </button>

          <button
            onClick={onDownloadZip}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition cursor-pointer font-medium text-xs"
            title="دانلود فایل‌های پایتون پروژه برای اجرا در محیط لوکال یا سرور"
          >
            <Download className="w-3 h-3" />
            دانلود سورس جنگو (.zip)
          </button>
          <span className="text-slate-500 font-mono text-[11px] dir-ltr">v1.2.0</span>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              سیستم فروش اشتراک هوش مصنوعی
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                ChatGPT / Gemini
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              ربات همزمان تلگرام و بله • مدیریت جنگو • پرداخت پیپینگ • زمان‌بندی هوشمند
            </p>
          </div>
        </div>

        {/* Tab links */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-sans">
                    {tab.badge}
                  </span>
                )}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full">
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
