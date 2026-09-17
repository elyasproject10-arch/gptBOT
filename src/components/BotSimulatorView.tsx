import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  Smartphone, 
  PhoneCall, 
  User, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { BotUser, ProductCategory, Plan, Order, Subscription, ChatMessage } from '../types';

interface BotSimulatorViewProps {
  users: BotUser[];
  categories: ProductCategory[];
  plans: Plan[];
  orders: Order[];
  subscriptions: Subscription[];
  currentUser: BotUser;
  setCurrentUser: (user: BotUser) => void;
  onOpenPayPingModal: (orderId: number, amount: number, planTitle: string, categoryName: string) => void;
  onUpdateUserPhone: (userId: number, phone: string) => void;
  adminMessages: Array<{ id: string; text: string; timestamp: string }>;
}

export const BotSimulatorView: React.FC<BotSimulatorViewProps> = ({
  users,
  categories,
  plans,
  orders,
  subscriptions,
  currentUser,
  setCurrentUser,
  onOpenPayPingModal,
  onUpdateUserPhone,
  adminMessages
}) => {
  const [platform, setPlatform] = useState<'telegram' | 'bale'>('telegram');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingPlanId, setPendingPlanId] = useState<number | null>(null);
  const [showContactKeyboard, setShowContactKeyboard] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync platform changes
  useEffect(() => {
    // If selected user's platform doesn't match, find or create matching user
    const matchingUser = users.find(u => u.platform === platform);
    if (matchingUser && matchingUser.id !== currentUser.id) {
      setCurrentUser(matchingUser);
    }
  }, [platform]);

  // Initialize chat when user/platform changes
  useEffect(() => {
    resetChat();
  }, [currentUser.id, platform]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showContactKeyboard]);

  const resetChat = () => {
    const welcomeMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'bot',
      text: `سلام ${currentUser.first_name} عزیز 👋\nبه سیستم فروش و مدیریت اشتراک خوش آمدید.\nلطفاً یکی از گزینه‌های زیر را انتخاب کنید:`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      replyMarkup: {
        inline_keyboard: [
          [{ text: '🛒 خرید / تمدید اشتراک', callback_data: 'menu_buy' }],
          [{ text: '👤 اشتراک‌های من', callback_data: 'menu_my_subs' }],
          [{ text: '📞 پشتیبانی', callback_data: 'menu_support' }]
        ]
      }
    };
    setMessages([welcomeMsg]);
    setShowContactKeyboard(false);
    setPendingPlanId(null);
  };

  // Format currency
  const formatToman = (val: number) => {
    return new Intl.NumberFormat('fa-IR').format(val) + ' تومان';
  };

  // Callback query handling (exact logic from bot/bot_runner.py)
  const handleCallback = (callbackData: string) => {
    const timestamp = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    if (callbackData === 'menu_main') {
      setShowContactKeyboard(false);
      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: 'منوی اصلی:',
        timestamp,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🛒 خرید / تمدید اشتراک', callback_data: 'menu_buy' }],
            [{ text: '👤 اشتراک‌های من', callback_data: 'menu_my_subs' }],
            [{ text: '📞 پشتیبانی', callback_data: 'menu_support' }]
          ]
        }
      };
      setMessages(prev => [...prev, newMsg]);
    } 
    else if (callbackData === 'menu_my_subs') {
      const userSubs = subscriptions.filter(s => s.user_id === currentUser.id && s.is_active);
      let text = '';
      if (userSubs.length === 0) {
        text = '❌ شما در حال حاضر هیچ اشتراک فعالی ندارید.';
      } else {
        text = '📋 **اشتراک‌های فعال شما:**\n\n';
        const now = new Date();
        userSubs.forEach(s => {
          const plan = plans.find(p => p.id === s.plan_id);
          const cat = categories.find(c => c.id === plan?.category_id);
          const end = new Date(s.end_date);
          const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24)));

          text += `🔹 **${cat?.name || 'سرویس'}** (${plan?.title})\n`;
          text += `⏱ روزهای باقیمانده: ${daysLeft} روز\n`;
          text += `📅 تاریخ انقضا: ${end.toLocaleDateString('fa-IR')}\n--------------------\n`;
        });
      }

      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text,
        timestamp,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🔙 بازگشت به منو', callback_data: 'menu_main' }]
          ]
        }
      };
      setMessages(prev => [...prev, newMsg]);
    }
    else if (callbackData === 'menu_support') {
      const text = '📞 **پشتیبانی سیستم**\n\nبرای ارتباط با پشتیبانی و طرح سوالات خود با آیدی زیر در ارتباط باشید:\n🆔 @Admin_Support';
      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text,
        timestamp,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '🔙 بازگشت به منو', callback_data: 'menu_main' }]
          ]
        }
      };
      setMessages(prev => [...prev, newMsg]);
    }
    else if (callbackData === 'menu_buy') {
      const activeCats = categories.filter(c => c.is_active);
      const catKeyboard = activeCats.map(cat => [
        { text: `🤖 ${cat.name}`, callback_data: `cat_${cat.id}` }
      ]);
      catKeyboard.push([{ text: '🔙 بازگشت', callback_data: 'menu_main' }]);

      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: 'لطفاً محصول مورد نظر خود را انتخاب کنید:',
        timestamp,
        replyMarkup: {
          inline_keyboard: catKeyboard
        }
      };
      setMessages(prev => [...prev, newMsg]);
    }
    else if (callbackData.startsWith('cat_')) {
      const catId = parseInt(callbackData.split('_')[1], 10);
      const catPlans = plans.filter(p => p.category_id === catId && p.is_active);

      const planKeyboard = catPlans.map(plan => [
        { text: `📌 ${plan.title} - ${formatToman(plan.price)}`, callback_data: `plan_${plan.id}` }
      ]);
      planKeyboard.push([{ text: '🔙 بازگشت', callback_data: 'menu_buy' }]);

      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: 'لطفاً یکی از پلن‌های زیر را انتخاب کنید:',
        timestamp,
        replyMarkup: {
          inline_keyboard: planKeyboard
        }
      };
      setMessages(prev => [...prev, newMsg]);
    }
    else if (callbackData.startsWith('plan_')) {
      const planId = parseInt(callbackData.split('_')[1], 10);
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      // Check if user has phone number
      if (!currentUser.phone_number) {
        setPendingPlanId(planId);
        setShowContactKeyboard(true);

        const newMsg: ChatMessage = {
          id: 'msg-' + Date.now(),
          sender: 'bot',
          text: '⚠️ برای صدور فاکتور و ثبت اشتراک، لطفاً با لمس دکمه زیر شماره موبایل خود را به اشتراک بگذارید:',
          timestamp
        };
        setMessages(prev => [...prev, newMsg]);
      } else {
        triggerInvoiceGeneration(currentUser, plan);
      }
    }
  };

  // Generate payment link (exact logic from generate_payment_link in bot_runner.py)
  const triggerInvoiceGeneration = (user: BotUser, plan: Plan) => {
    const timestamp = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const cat = categories.find(c => c.id === plan.category_id);
    const mockOrderId = Math.floor(1000 + Math.random() * 9000);

    const invoiceText = `📄 **فاکتور پرداخت شما:**\n\n` +
      `🔹 محصول: ${cat?.name || 'سرویس هوش مصنوعی'}\n` +
      `🔹 پلن: ${plan.title}\n` +
      `💰 مبلغ قابل پرداخت: ${formatToman(plan.price)}\n` +
      `📱 شماره همراه: ${user.phone_number}\n\n` +
      `لطفاً جهت تکمیل فرایند خرید روی دکمه پرداخت زیر کلیک کنید:`;

    const invoiceMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'bot',
      text: invoiceText,
      timestamp,
      replyMarkup: {
        inline_keyboard: [
          [{ text: '💳 پرداخت آنلاین (پیپینگ)', callback_data: `pay_${mockOrderId}_${plan.id}` }],
          [{ text: '🔙 بازگشت به منوی اصلی', callback_data: 'menu_main' }]
        ]
      }
    };

    setMessages(prev => [...prev, invoiceMsg]);
    setShowContactKeyboard(false);
    setPendingPlanId(null);
  };

  // Share Contact button handler (contact_handler in bot_runner.py)
  const handleShareContact = () => {
    const samplePhone = '0912' + Math.floor(1000000 + Math.random() * 9000000);
    onUpdateUserPhone(currentUser.id, samplePhone);

    const timestamp = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const userContactMsg: ChatMessage = {
      id: 'msg-contact-' + Date.now(),
      sender: 'user',
      text: `📱 شماره تماس اشتراک‌گذاری شد: ${samplePhone}`,
      timestamp
    };
    const botConfirmMsg: ChatMessage = {
      id: 'msg-confirm-' + Date.now(),
      sender: 'bot',
      text: '✅ شماره شما با موفقیت ثبت شد.',
      timestamp
    };

    setMessages(prev => [...prev, userContactMsg, botConfirmMsg]);
    setShowContactKeyboard(false);

    // If there was a pending plan, proceed with invoice
    if (pendingPlanId) {
      const plan = plans.find(p => p.id === pendingPlanId);
      if (plan) {
        setTimeout(() => {
          triggerInvoiceGeneration({ ...currentUser, phone_number: samplePhone }, plan);
        }, 500);
      }
    }
  };

  // Manual text sending (e.g. /start)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');
    const timestamp = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, {
      id: 'msg-user-' + Date.now(),
      sender: 'user',
      text,
      timestamp
    }]);

    if (text === '/start') {
      setTimeout(() => {
        resetChat();
      }, 300);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: 'msg-bot-echo-' + Date.now(),
          sender: 'bot',
          text: 'لطفاً از دکمه‌های شیشه‌ای منو برای سفارش یا بررسی اشتراک استفاده فرمایید یا دستور /start را ارسال کنید.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          replyMarkup: {
            inline_keyboard: [
              [{ text: '🔙 منوی اصلی', callback_data: 'menu_main' }]
            ]
          }
        }]);
      }, 400);
    }
  };

  const isTelegram = platform === 'telegram';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Platform Switcher & User Selection */}
      <div className="lg:col-span-4 space-y-4">
        {/* Platform Selection */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="text-xs font-bold text-slate-300 block">انتخاب پیام‌رسان فعال در شبیه‌ساز:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPlatform('telegram')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                isTelegram
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Send className="w-4 h-4" />
              ربات تلگرام
            </button>
            <button
              onClick={() => setPlatform('bale')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                !isTelegram
                  ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-600/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Bot className="w-4 h-4" />
              ربات بله (Bale)
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isTelegram
              ? 'در ربات تلگرام، درخواست‌ها به api.telegram.org ارسال شده و از Polling استاندارد استفاده می‌شود.'
              : 'در ربات بله، Base URL روی https://tapi.bale.ai/bot تنظیم شده و دقیقاً با همان کدهای پایتون اجرا می‌شود.'}
          </p>
        </div>

        {/* User Persona Switcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">انتخاب کاربر فعال تست:</label>
            <span className="text-[11px] text-slate-500 font-mono">DB: BotUser</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {users.map(u => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    setPlatform(u.platform);
                  }}
                  className={`w-full text-right p-2.5 rounded-lg border text-xs flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {u.first_name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{u.first_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {u.phone_number ? u.phone_number : '⚠️ بدون شماره تماس'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    u.platform === 'telegram' ? 'bg-sky-500/10 text-sky-400' : 'bg-teal-500/10 text-teal-400'
                  }`}>
                    {u.platform === 'telegram' ? 'تلگرام' : 'بله'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">شماره ثبت شده:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {currentUser.phone_number || 'هنوز ثبت نشده (درخواست ارسال شماره خواهد شد)'}
            </span>
          </div>
        </div>

        {/* Live Admin Telegram/Bale Alerts Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              کانال اعلان‌های ادمین (ADMIN_CHAT_ID)
            </h4>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
              تلگرام
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            پیام‌های فوری خرید موفق و هشدارهای کرون‌جاب مستقیماً به چت آیدی ادمین ارسال می‌شوند:
          </p>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {adminMessages.length === 0 ? (
              <div className="text-[11px] text-slate-500 text-center py-4 bg-slate-950 rounded-lg">
                هنوز اعلانی برای ادمین ثبت نشده است. با پرداخت سفارش یا تست کرون‌جاب، اعلان در اینجا منعکس می‌شود.
              </div>
            ) : (
              adminMessages.map(m => (
                <div key={m.id} className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/30 text-[11px] text-amber-200/90 whitespace-pre-line font-sans leading-relaxed">
                  <div className="text-[10px] text-slate-500 mb-1 font-mono">{m.timestamp}</div>
                  {m.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Center/Right Column: Phone Mockup with Chat */}
      <div className="lg:col-span-8 flex justify-center">
        <div className="w-full max-w-[480px] bg-slate-950 rounded-[32px] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[740px] relative">
          {/* Phone Top Notch / Header */}
          <div className={`p-3.5 flex items-center justify-between border-b ${
            isTelegram 
              ? 'bg-slate-900/95 border-slate-800 text-sky-400' 
              : 'bg-teal-950/90 border-teal-800/60 text-teal-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                isTelegram ? 'bg-sky-500' : 'bg-teal-600'
              }`}>
                {isTelegram ? <Send className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  {isTelegram ? 'ربات فروش اشتراک تلگرام' : 'ربات فروش اشتراک بله'}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {isTelegram ? '@AISubscription_Bot • bot' : 'tapi.bale.ai • bot'}
                </div>
              </div>
            </div>

            <button
              onClick={resetChat}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="ریست چت و ارسال مجدد /start"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-950 to-slate-900/60 text-xs">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-sm whitespace-pre-line ${
                      isBot
                        ? isTelegram
                          ? 'bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/60'
                          : 'bg-teal-950/70 text-slate-100 rounded-tl-none border border-teal-800/40'
                        : isTelegram
                        ? 'bg-sky-600 text-white rounded-tr-none'
                        : 'bg-teal-600 text-white rounded-tr-none'
                    }`}
                  >
                    {msg.text}

                    <div className={`text-[10px] mt-1 font-mono text-left ${
                      isBot ? 'text-slate-400' : 'text-slate-200/80'
                    }`}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Inline Keyboard Buttons */}
                  {msg.replyMarkup?.inline_keyboard && (
                    <div className="w-[85%] space-y-1.5 pt-1">
                      {msg.replyMarkup.inline_keyboard.map((row, rIdx) => (
                        <div key={rIdx} className="grid grid-cols-1 gap-1.5">
                          {row.map((btn, bIdx) => {
                            const isPayButton = btn.callback_data?.startsWith('pay_');
                            return (
                              <button
                                key={bIdx}
                                onClick={() => {
                                  if (isPayButton && btn.callback_data) {
                                    const parts = btn.callback_data.split('_');
                                    const orderId = parseInt(parts[1], 10);
                                    const planId = parseInt(parts[2], 10);
                                    const plan = plans.find(p => p.id === planId);
                                    const cat = categories.find(c => c.id === plan?.category_id);
                                    if (plan) {
                                      onOpenPayPingModal(orderId, plan.price, plan.title, cat?.name || 'سرویس');
                                    }
                                  } else if (btn.callback_data) {
                                    handleCallback(btn.callback_data);
                                  }
                                }}
                                className={`w-full py-2.5 px-3 rounded-xl font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                                  isPayButton
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold border border-emerald-400/40 shadow-emerald-500/20'
                                    : isTelegram
                                    ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
                                    : 'bg-teal-900/60 hover:bg-teal-800/70 text-teal-200 border border-teal-700/50'
                                }`}
                              >
                                {btn.text}
                                {isPayButton && <ExternalLink className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Contact Request Sheet (if phone number is missing) */}
          {showContactKeyboard && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={handleShareContact}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                📱 ارسال شماره موبایل جهت تایید
              </button>
              <div className="text-[10px] text-slate-400 text-center mt-1.5">
                (با یک کلیک، شماره کاربر شبیه‌سازی شده و فاکتور PayPing صادر می‌شود)
              </div>
            </div>
          )}

          {/* Input text bar */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setInputText('/start');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer"
              title="پر کردن دستور /start"
            >
              /start
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="پیام خود را بنویسید (مثلاً /start)..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className={`p-2 rounded-xl text-white cursor-pointer transition ${
                isTelegram ? 'bg-sky-600 hover:bg-sky-500' : 'bg-teal-600 hover:bg-teal-500'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
