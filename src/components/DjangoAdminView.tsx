import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit3, 
  Trash2, 
  Send, 
  Bot, 
  Tag, 
  CreditCard, 
  UserCheck, 
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { BotUser, ProductCategory, Plan, Order, Subscription } from '../types';

interface DjangoAdminViewProps {
  users: BotUser[];
  categories: ProductCategory[];
  plans: Plan[];
  orders: Order[];
  subscriptions: Subscription[];
  onAddCategory: (name: string, description: string) => void;
  onAddPlan: (categoryId: number, title: string, price: number, durationDays: number) => void;
  onToggleSubscription: (subId: number) => void;
  onExtendSubscription: (subId: number, days: number) => void;
  onUpdateOrderStatus: (orderId: number, status: 'pending' | 'success' | 'failed') => void;
}

export const DjangoAdminView: React.FC<DjangoAdminViewProps> = ({
  users,
  categories,
  plans,
  orders,
  subscriptions,
  onAddCategory,
  onAddPlan,
  onToggleSubscription,
  onExtendSubscription,
  onUpdateOrderStatus
}) => {
  const [activeModel, setActiveModel] = useState<'orders' | 'subscriptions' | 'plans' | 'categories' | 'users'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'telegram' | 'bale'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');

  // New Category form state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New Plan form state
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanCatId, setNewPlanCatId] = useState<number>(categories[0]?.id || 1);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState<number>(1200000);
  const [newPlanDays, setNewPlanDays] = useState<number>(30);

  const formatToman = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  const now = new Date();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Django Admin Top Bar Header */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded bg-indigo-700 text-white font-mono text-xs font-bold tracking-wider uppercase">
            Django
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              پنل مدیریت جنگو • Django Administration
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span>store / admin.py</span>
              <span>•</span>
              <span>مدیریت پایگاه‌داده متمرکز SQLite / PostgreSQL</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">ورود با اکانت ادمین:</span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-mono text-xs font-bold border border-slate-700">
            superuser (admin)
          </span>
        </div>
      </div>

      {/* Online Ready Banner - Zero Download Required */}
      <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-bold text-sm text-emerald-200">پنل مدیریت آنلاین فعال است:</span>
          <span className="text-slate-200">
            شما نیازی به دانلود نرم‌افزار، نصب پایگاه داده یا اجرای سرور روی کامپیوتر ندارید! 
            تمام اطلاعات کاربران، محصولات، پلن‌ها، سفارشات و تایید دستی اشتراک‌ها مستقیماً در همین صفحه ابری قابل مدیریت است.
          </span>
        </div>
      </div>

      {/* Breadcrumb & Navigation Tabs */}
      <div className="px-6 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveModel('orders')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeModel === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            سفارش‌ها (Orders)
            <span className="text-[10px] px-1.5 rounded-full bg-slate-950/60 font-mono">{orders.length}</span>
          </button>

          <button
            onClick={() => setActiveModel('subscriptions')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeModel === 'subscriptions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            اشتراک‌ها (Subscriptions)
            <span className="text-[10px] px-1.5 rounded-full bg-slate-950/60 font-mono">{subscriptions.length}</span>
          </button>

          <button
            onClick={() => setActiveModel('plans')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeModel === 'plans' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            پلن‌های اشتراک (Plans)
            <span className="text-[10px] px-1.5 rounded-full bg-slate-950/60 font-mono">{plans.length}</span>
          </button>

          <button
            onClick={() => setActiveModel('categories')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeModel === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            دسته‌بندی‌ها (ProductCategory)
            <span className="text-[10px] px-1.5 rounded-full bg-slate-950/60 font-mono">{categories.length}</span>
          </button>

          <button
            onClick={() => setActiveModel('users')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeModel === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            کاربران ربات (BotUser)
            <span className="text-[10px] px-1.5 rounded-full bg-slate-950/60 font-mono">{users.length}</span>
          </button>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {activeModel === 'categories' && (
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن دسته‌بندی جدید
            </button>
          )}

          {activeModel === 'plans' && (
            <button
              onClick={() => setShowAddPlanModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن پلن جدید
            </button>
          )}
        </div>
      </div>

      {/* Model Views Content */}
      <div className="p-6 space-y-4">
        {/* ================= MODEL 1: ORDERS ================= */}
        {activeModel === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجو در شناسه سفارش، کد پیگیری یا شماره تماس..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">فیلتر وضعیت:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="success">موفق</option>
                  <option value="pending">در انتظار پرداخت</option>
                  <option value="failed">ناموفق</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">شناسه (ID)</th>
                    <th className="py-3 px-4">کاربر</th>
                    <th className="py-3 px-4">پلن و محصول</th>
                    <th className="py-3 px-4">مبلغ (تومان)</th>
                    <th className="py-3 px-4">کد پیپینگ</th>
                    <th className="py-3 px-4">شماره پیگیری درگاه</th>
                    <th className="py-3 px-4">وضعیت</th>
                    <th className="py-3 px-4">تاریخ ثبت</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders
                    .filter(o => {
                      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
                      if (!searchQuery) return true;
                      const user = users.find(u => u.id === o.user_id);
                      const term = searchQuery.toLowerCase();
                      return (
                        o.id.toString().includes(term) ||
                        (o.ref_id && o.ref_id.toLowerCase().includes(term)) ||
                        (o.payping_code && o.payping_code.toLowerCase().includes(term)) ||
                        (user?.phone_number && user.phone_number.includes(term)) ||
                        (user?.first_name && user.first_name.toLowerCase().includes(term))
                      );
                    })
                    .map(order => {
                      const user = users.find(u => u.id === order.user_id);
                      const plan = plans.find(p => p.id === order.plan_id);
                      const cat = categories.find(c => c.id === plan?.category_id);

                      return (
                        <tr key={order.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-300">#{order.id}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-200">{user?.first_name || 'ناشناس'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{user?.phone_number || 'بدون شماره'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-200 font-medium">{cat?.name}</div>
                            <div className="text-[11px] text-slate-400">{plan?.title}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                            {formatToman(order.amount)}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {order.payping_code || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {order.ref_id || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-block ${
                              order.status === 'success'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : order.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {order.status === 'success' ? 'موفق' : order.status === 'pending' ? 'در انتظار پرداخت' : 'ناموفق'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                            {new Date(order.created_at).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'success')}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] cursor-pointer transition font-medium"
                                title="تایید دستی پرداخت و ثبت فوری اشتراک"
                              >
                                تایید پرداخت
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODEL 2: SUBSCRIPTIONS ================= */}
        {activeModel === 'subscriptions' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400">
              اشتراک‌های ثبت شده در سامانه با محاسبه خودکار فیلد <code className="font-mono text-sky-400">days_remaining</code> و قابلیت تمدید دستی:
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">کاربر (User)</th>
                    <th className="py-3 px-4">پلن و محصول</th>
                    <th className="py-3 px-4">تاریخ شروع</th>
                    <th className="py-3 px-4">تاریخ انقضا</th>
                    <th className="py-3 px-4">روزهای باقیمانده</th>
                    <th className="py-3 px-4">وضعیت فعال</th>
                    <th className="py-3 px-4 text-center">عملیات دستی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {subscriptions.map(sub => {
                    const user = users.find(u => u.id === sub.user_id);
                    const plan = plans.find(p => p.id === sub.plan_id);
                    const cat = categories.find(c => c.id === plan?.category_id);

                    const endDate = new Date(sub.end_date);
                    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));
                    const isExpired = daysLeft <= 0 || !sub.is_active;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{user?.first_name || 'کاربر'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{user?.phone_number || 'بدون شماره'}</div>
                          <div className="text-[10px] text-sky-400 font-mono">
                            {user?.platform === 'telegram' ? 'Telegram Bot' : 'Bale Messenger'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{cat?.name}</div>
                          <div className="text-[11px] text-slate-400">{plan?.title}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {new Date(sub.start_date).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {endDate.toLocaleDateString('fa-IR')}
                        </td>
                        <td className="py-3 px-4 font-bold font-mono">
                          {isExpired ? (
                            <span className="text-rose-400">۰ روز (منقضی)</span>
                          ) : daysLeft <= 3 ? (
                            <span className="text-amber-400">{daysLeft} روز</span>
                          ) : (
                            <span className="text-emerald-400">{daysLeft} روز</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => onToggleSubscription(sub.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition ${
                              sub.is_active && !isExpired
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                            }`}
                          >
                            {sub.is_active && !isExpired ? 'فعال (قطع دسترسی)' : 'غیرفعال (فعال‌سازی)'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onExtendSubscription(sub.id, 30)}
                            className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium cursor-pointer transition"
                          >
                            +۳۰ روز تمدید
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODEL 3: PLANS ================= */}
        {activeModel === 'plans' && (
          <div className="space-y-4">
            <div className="border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">عنوان پلن</th>
                    <th className="py-3 px-4">دسته‌بندی (محصول)</th>
                    <th className="py-3 px-4">قیمت</th>
                    <th className="py-3 px-4">مدت اعتبار</th>
                    <th className="py-3 px-4">وضعیت</th>
                    <th className="py-3 px-4">توضیحات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {plans.map(plan => {
                    const cat = categories.find(c => c.id === plan.category_id);
                    return (
                      <tr key={plan.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold text-slate-200">{plan.title}</td>
                        <td className="py-3 px-4 text-slate-300">{cat?.name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {formatToman(plan.price)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {plan.duration_days} روز
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            plan.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {plan.is_active ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {plan.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODEL 4: CATEGORIES ================= */}
        {activeModel === 'categories' && (
          <div className="space-y-4">
            <div className="border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">شناسه</th>
                    <th className="py-3 px-4">نام محصول (مثلاً ChatGPT / Gemini)</th>
                    <th className="py-3 px-4">توضیحات محصول</th>
                    <th className="py-3 px-4">تعداد پلن‌ها</th>
                    <th className="py-3 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {categories.map(cat => {
                    const catPlans = plans.filter(p => p.category_id === cat.id);
                    return (
                      <tr key={cat.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">#{cat.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-200">{cat.name}</td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{cat.description}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{catPlans.length} پلن</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            cat.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {cat.is_active ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MODEL 5: BOT USERS ================= */}
        {activeModel === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">فیلتر پیام‌رسان:</span>
                <select
                  value={platformFilter}
                  onChange={e => setPlatformFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="all">همه پیام‌رسان‌ها</option>
                  <option value="telegram">فقط تلگرام</option>
                  <option value="bale">فقط بله</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">شناسه یکتا پیام‌رسان (user_id)</th>
                    <th className="py-3 px-4">نام</th>
                    <th className="py-3 px-4">نام کاربری</th>
                    <th className="py-3 px-4">شماره همراه</th>
                    <th className="py-3 px-4">پیام‌رسان</th>
                    <th className="py-3 px-4">تاریخ عضویت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users
                    .filter(u => platformFilter === 'all' || u.platform === platformFilter)
                    .map(user => (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-300">
                          {user.user_id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {user.first_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {user.username ? `@${user.username}` : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-medium">
                          {user.phone_number || 'ثبت نشده'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            user.platform === 'telegram'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          }`}>
                            {user.platform === 'telegram' ? 'Telegram' : 'Bale'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                          {new Date(user.created_at).toLocaleDateString('fa-IR')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD CATEGORY */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">افزودن دسته‌بندی جدید به Django</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">نام محصول (مثلاً Perplexity AI):</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="نام محصول..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">توضیحات کوتاه:</label>
                <textarea
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="توضیحات دسترسی و قابلیت‌ها..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white h-20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  if (newCatName.trim()) {
                    onAddCategory(newCatName.trim(), newCatDesc.trim());
                    setShowAddCategoryModal(false);
                    setNewCatName('');
                    setNewCatDesc('');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                ذخیره دسته‌بندی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PLAN */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">افزودن پلن جدید به دسته‌بندی</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">انتخاب محصول (Category):</label>
                <select
                  value={newPlanCatId}
                  onChange={e => setNewPlanCatId(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">عنوان پلن (مثلاً ۱ ماهه پرو):</label>
                <input
                  type="text"
                  value={newPlanTitle}
                  onChange={e => setNewPlanTitle(e.target.value)}
                  placeholder="عنوان پلن..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">قیمت به تومان:</label>
                <input
                  type="number"
                  value={newPlanPrice}
                  onChange={e => setNewPlanPrice(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">مدت زمان اعتبار (به روز):</label>
                <input
                  type="number"
                  value={newPlanDays}
                  onChange={e => setNewPlanDays(parseInt(e.target.value, 10) || 30)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddPlanModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  if (newPlanTitle.trim()) {
                    onAddPlan(newPlanCatId, newPlanTitle.trim(), newPlanPrice, newPlanDays);
                    setShowAddPlanModal(false);
                    setNewPlanTitle('');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                ذخیره پلن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
