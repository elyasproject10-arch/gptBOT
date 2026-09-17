import React, { useState } from 'react';
import { 
  CreditCard, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Play, 
  ExternalLink, 
  RefreshCw, 
  Lock, 
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { Plan, ProductCategory, BotUser, Order } from '../types';

interface PayPingSandboxViewProps {
  plans: Plan[];
  categories: ProductCategory[];
  users: BotUser[];
  orders: Order[];
  onTriggerTestPayment: (planId: number, userId: number) => void;
  onVerifyOrderManually: (orderId: number) => void;
}

export const PayPingSandboxView: React.FC<PayPingSandboxViewProps> = ({
  plans,
  categories,
  users,
  orders,
  onTriggerTestPayment,
  onVerifyOrderManually
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<number>(plans[0]?.id || 1);
  const [selectedUserId, setSelectedUserId] = useState<number>(users[0]?.id || 1);
  const [testRefId, setTestRefId] = useState<string>('REF_7719283');
  const [lastApiResponse, setLastApiResponse] = useState<any>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedCat = categories.find(c => c.id === selectedPlan?.category_id);
  const selectedUser = users.find(u => u.id === selectedUserId);

  const formatToman = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  const handleSimulateCreatePayment = () => {
    if (!selectedPlan || !selectedUser) return;

    const mockCode = 'PPG-' + Math.floor(10000 + Math.random() * 90000) + '-OK';
    const payload = {
      amount: selectedPlan.price,
      payerIdentity: selectedUser.phone_number || "09120000000",
      returnUrl: "https://your-domain.com/payment/verify/",
      clientRefId: String(Math.floor(1000 + Math.random() * 9000)),
      description: `خرید ${selectedCat?.name} - ${selectedPlan.title}`
    };

    const response = {
      status: 200,
      code: mockCode,
      gateway_url: `https://api.payping.ir/v2/pay/gotoipg/${mockCode}`,
      payload_sent: payload
    };

    setLastApiResponse(response);
    onTriggerTestPayment(selectedPlan.id, selectedUser.id);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
          <CreditCard className="w-3.5 h-3.5" />
          تست و عیب‌یابی درگاه پرداخت پی‌پینگ (PayPing IPG Sandbox)
        </div>
        <h2 className="text-xl font-bold text-white">
          ماژول ساخت تراکنش و وبهوک کالبک تایید (/payment/verify/)
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          در این بخش می‌توانید فرآیند فراخوانی متد <code className="font-mono text-sky-400">create_payping_payment</code> و <code className="font-mono text-emerald-400">verify_payping_payment</code> را بدون نیاز به ربات شبیه‌سازی و تست کنید.
        </p>
      </div>

      {/* Simulator Form & Live JSON Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            شبیه‌سازی صدور فاکتور و ایجاد تراکنش (POST /v2/pay)
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">انتخاب پلن و محصول:</label>
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              >
                {plans.map(p => {
                  const cat = categories.find(c => c.id === p.category_id);
                  return (
                    <option key={p.id} value={p.id}>
                      {cat?.name} • {p.title} ({formatToman(p.price)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">انتخاب خریدار (کاربر دیتابیس):</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} ({u.phone_number || 'بدون شماره'}) • {u.platform}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">مبلغ پرداختی:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedPlan ? formatToman(selectedPlan.price) : '۰'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">شناسه کاربر در ربات:</span>
                <span className="font-mono text-slate-300">{selectedUser?.user_id}</span>
              </div>
            </div>

            <button
              onClick={handleSimulateCreatePayment}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition"
            >
              <Play className="w-4 h-4 fill-white" />
              ارسال درخواست ایجاد پرداخت به پیپینگ
            </button>
          </div>
        </div>

        {/* Right JSON Response Inspector */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              پاسخ وب‌سرویس PayPing (API Response)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
              Status 200 OK
            </span>
          </div>

          <div className="p-4 flex-1 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto" dir="ltr">
            {lastApiResponse ? (
              <pre className="text-emerald-400 leading-relaxed">
                {JSON.stringify(lastApiResponse, null, 2)}
              </pre>
            ) : (
              <div className="text-slate-500 text-center py-12 font-sans text-xs">
                با فشردن دکمه «ارسال درخواست»، پاسخ دریافتی شامل لینک پرداخت و کد رهگیری در اینجا نمایش می‌یابد.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Webhook Verify Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          تست دستی کالبک تایید پرداخت جنگو (GET/POST /payment/verify/)
        </h3>
        <p className="text-xs text-slate-400">
          تراکنش‌های در انتظار تایید را انتخاب نموده و کالبک بازگشت از درگاه را تست کنید:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {orders
            .filter(o => o.status === 'pending')
            .map(order => {
              const plan = plans.find(p => p.id === order.plan_id);
              const user = users.find(u => u.id === order.user_id);
              return (
                <div key={order.id} className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white font-mono">سفارش #{order.id}</div>
                    <div className="text-[11px] text-slate-400">{user?.first_name} • {plan?.title}</div>
                    <div className="text-[11px] font-mono text-emerald-400">{formatToman(order.amount)}</div>
                  </div>

                  <button
                    onClick={() => onVerifyOrderManually(order.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    تایید تراکنش
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
