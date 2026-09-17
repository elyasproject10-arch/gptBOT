import React, { useState } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Smartphone, 
  HelpCircle,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface PayPingGatewayModalProps {
  isOpen: boolean;
  orderId: number;
  amount: number;
  planTitle: string;
  categoryName: string;
  userPhone: string;
  onClose: () => void;
  onSuccess: (orderId: number, refId: string) => void;
  onFail: (orderId: number) => void;
}

export const PayPingGatewayModal: React.FC<PayPingGatewayModalProps> = ({
  isOpen,
  orderId,
  amount,
  planTitle,
  categoryName,
  userPhone,
  onClose,
  onSuccess,
  onFail
}) => {
  const [cardNumber, setCardNumber] = useState('6037-9975-4321-8890');
  const [cvv2, setCvv2] = useState('834');
  const [expMonth, setExpMonth] = useState('08');
  const [expYear, setExpYear] = useState('06');
  const [pin, setPin] = useState('549102');
  const [isLoading, setIsLoading] = useState(false);
  const [resultState, setResultState] = useState<'idle' | 'success' | 'failed'>('idle');
  const [generatedRefId, setGeneratedRefId] = useState('');

  if (!isOpen) return null;

  const formatToman = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  const handlePaySuccess = () => {
    setIsLoading(true);
    const refId = 'REF_' + Math.floor(10000000 + Math.random() * 90000000);
    setGeneratedRefId(refId);

    setTimeout(() => {
      setIsLoading(false);
      setResultState('success');
      onSuccess(orderId, refId);
    }, 1200);
  };

  const handlePayCancel = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResultState('failed');
      onFail(orderId);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Top Official PayPing Bar */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-4 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 font-bold flex items-center justify-center text-sm">
              PP
            </div>
            <div>
              <div className="font-bold text-sm text-slate-950">درگاه پرداخت پی‌پینگ (PayPing)</div>
              <div className="text-[11px] text-slate-900/80 font-mono">api.payping.ir/v2/pay/gotoipg</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-slate-950/15 px-2.5 py-1 rounded-full font-medium">
            <Lock className="w-3.5 h-3.5 text-slate-950" />
            اتصال امن SSL
          </div>
        </div>

        {/* Order Details Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">پذیرنده (فروشگاه):</span>
            <span className="text-white font-bold">سامانه فروش اشتراک هوش مصنوعی</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">محصول و پلن انتخابی:</span>
            <span className="text-indigo-300 font-medium">{categoryName} • {planTitle}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">شناسه سفارش (Client Ref ID):</span>
            <span className="font-mono text-slate-200 font-bold">#{orderId}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-slate-300 text-xs font-medium">مبلغ قابل پرداخت:</span>
            <div className="text-right">
              <div className="text-xl font-bold font-mono text-emerald-400">
                {formatToman(amount)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                معادل {(amount * 10).toLocaleString('fa-IR')} ریال
              </div>
            </div>
          </div>
        </div>

        {/* Gateway Form / Result */}
        <div className="p-6 space-y-4">
          {resultState === 'idle' ? (
            <div className="space-y-4 text-xs">
              {/* Card Number Input */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-medium">شماره کارت بانکی (۱۶ رقم):</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center font-mono text-sm tracking-widest text-white focus:outline-none focus:border-amber-500"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* CVV2 and Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">کد CVV2:</label>
                  <input
                    type="password"
                    value={cvv2}
                    onChange={e => setCvv2(e.target.value)}
                    dir="ltr"
                    maxLength={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center font-mono text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">تاریخ انقضا (ماه / سال):</label>
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <input
                      type="text"
                      value={expMonth}
                      onChange={e => setExpMonth(e.target.value)}
                      maxLength={2}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-center font-mono text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-slate-600">/</span>
                    <input
                      type="text"
                      value={expYear}
                      onChange={e => setExpYear(e.target.value)}
                      maxLength={2}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-center font-mono text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic SMS OTP */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-medium">رمز دوم پویا (OTP):</label>
                  <span className="text-[11px] text-amber-400 cursor-pointer hover:underline">درخواست رمز پویا</span>
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center font-mono text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex flex-col gap-2.5">
                <button
                  onClick={handlePaySuccess}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition"
                >
                  {isLoading ? (
                    <span>در حال اعتبارسنجی با PayPing...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      تکمیل پرداخت و هدایت به کالبک جنگو (موفق)
                    </>
                  )}
                </button>

                <button
                  onClick={handlePayCancel}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  انصراف از پرداخت (شبیه‌سازی تراکنش لغو شده)
                </button>
              </div>
            </div>
          ) : resultState === 'success' ? (
            /* Django HTTP Response Simulation (store/views.py: payment_verify_view) */
            <div className="space-y-4 py-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">پرداخت با موفقیت انجام شد</h3>
                <p className="text-xs text-slate-300">
                  تراکنش با موفقیت در پیپینگ تایید شد و اشتراک در پایگاه داده جنگو ثبت گردید.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-right space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">کد پیگیری درگاه:</span>
                  <span className="font-mono text-emerald-400 font-bold">{generatedRefId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">شماره سفارش:</span>
                  <span className="font-mono text-slate-200">#{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">اعلان‌های ارسالی:</span>
                  <span className="text-sky-400 font-medium">پیام ربات به کاربر + اعلان فوری به ادمین</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-indigo-600/30"
              >
                بازگشت به ربات و مشاهده پیام تایید
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Failed state */
            <div className="space-y-4 py-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">پرداخت ناموفق بود</h3>
                <p className="text-xs text-slate-300">
                  تراکنش توسط کاربر لغو شد یا درگاه پاسخ منفی ارسال نمود.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs cursor-pointer transition"
              >
                بستن و بازگشت به ربات
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
