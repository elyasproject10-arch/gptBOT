import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SimpleBotView } from './components/SimpleBotView';
import { DashboardView } from './components/DashboardView';
import { BotSimulatorView } from './components/BotSimulatorView';
import { DjangoAdminView } from './components/DjangoAdminView';
import { SchedulerView } from './components/SchedulerView';
import { CodeExplorerView } from './components/CodeExplorerView';
import { SettingsView } from './components/SettingsView';
import { PayPingSandboxView } from './components/PayPingSandboxView';
import { PayPingGatewayModal } from './components/PayPingGatewayModal';
import { downloadProjectZip } from './utils/zipExport';
import { 
  initialCategories, 
  initialPlans, 
  initialUsers, 
  initialOrders, 
  initialSubscriptions, 
  initialSettings 
} from './data/initialData';
import { 
  BotUser, 
  ProductCategory, 
  Plan, 
  Order, 
  Subscription, 
  ProjectSettings, 
  SystemNotification, 
  CronLog 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('simplebot');

  // Core Database Models State
  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    const saved = localStorage.getItem('subs_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('subs_plans');
    return saved ? JSON.parse(saved) : initialPlans;
  });

  const [users, setUsers] = useState<BotUser[]>(() => {
    const saved = localStorage.getItem('subs_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('subs_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('subs_subscriptions');
    return saved ? JSON.parse(saved) : initialSubscriptions;
  });

  const [settings, setSettings] = useState<ProjectSettings>(() => {
    const saved = localStorage.getItem('subs_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [currentUser, setCurrentUser] = useState<BotUser>(() => users[0] || initialUsers[0]);

  // Notifications & Cron Logs
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [adminMessages, setAdminMessages] = useState<Array<{ id: string; text: string; timestamp: string }>>([
    {
      id: 'init-admin',
      text: '🤖 ربات‌های تلگرام و بله با موفقیت به پایگاه داده جنگو متصل شدند. سیستم آماده پذیرش سفارش است.',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [cronLogs, setCronLogs] = useState<CronLog[]>([]);
  const [simulationDayOffset, setSimulationDayOffset] = useState<number>(0);

  // PayPing Modal State
  const [payModal, setPayModal] = useState<{
    isOpen: boolean;
    orderId: number;
    amount: number;
    planTitle: string;
    categoryName: string;
  }>({
    isOpen: false,
    orderId: 0,
    amount: 0,
    planTitle: '',
    categoryName: ''
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('subs_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('subs_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('subs_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('subs_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('subs_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('subs_settings', JSON.stringify(settings));
  }, [settings]);

  // Pending orders and expiring count
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const now = new Date();
  now.setDate(now.getDate() + simulationDayOffset);

  const expiringCount = subscriptions.filter(s => {
    if (!s.is_active) return false;
    const end = new Date(s.end_date);
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return days <= 5 && days > 0;
  }).length;

  // Add Category Handler
  const handleAddCategory = (name: string, description: string) => {
    const newCat: ProductCategory = {
      id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
      name,
      description,
      is_active: true
    };
    setCategories(prev => [...prev, newCat]);
  };

  // Add Plan Handler
  const handleAddPlan = (categoryId: number, title: string, price: number, durationDays: number) => {
    const newPlan: Plan = {
      id: plans.length > 0 ? Math.max(...plans.map(p => p.id)) + 1 : 1,
      category_id: categoryId,
      title,
      description: `دسترسی کامل ${durationDays} روزه`,
      price,
      duration_days: durationDays,
      is_active: true
    };
    setPlans(prev => [...prev, newPlan]);
  };

  // Update User Phone
  const handleUpdateUserPhone = (userId: number, phone: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, phone_number: phone } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, phone_number: phone }));
    }
  };

  // Open PayPing Modal
  const handleOpenPayPingModal = (orderId: number, amount: number, planTitle: string, categoryName: string) => {
    // Check if order exists, if not create
    let existingOrder = orders.find(o => o.id === orderId);
    if (!existingOrder) {
      const plan = plans.find(p => p.title === planTitle);
      const newOrder: Order = {
        id: orderId,
        user_id: currentUser.id,
        plan_id: plan ? plan.id : plans[0].id,
        amount,
        payping_code: 'PPG-' + Math.floor(10000 + Math.random() * 90000),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      setOrders(prev => [newOrder, ...prev]);
    }

    setPayModal({
      isOpen: true,
      orderId,
      amount,
      planTitle,
      categoryName
    });
  };

  // PayPing Payment Success Handler (Exact logic of payment_verify_view in store/views.py)
  const handlePayPingSuccess = (orderId: number, refId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // 1. Update Order
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'success', ref_id: refId } : o));

    const user = users.find(u => u.id === order.user_id) || currentUser;
    const plan = plans.find(p => p.id === order.plan_id) || plans[0];
    const category = categories.find(c => c.id === plan.category_id);

    // 2. Create or Extend Subscription
    setSubscriptions(prev => {
      const existingSub = prev.find(s => s.user_id === user.id && s.plan_id === plan.id);
      if (existingSub) {
        const baseDate = new Date(existingSub.end_date) > new Date() ? new Date(existingSub.end_date) : new Date();
        baseDate.setDate(baseDate.getDate() + plan.duration_days);
        return prev.map(s => s.id === existingSub.id ? { ...s, end_date: baseDate.toISOString(), is_active: true } : s);
      } else {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);
        const newSub: Subscription = {
          id: prev.length > 0 ? Math.max(...prev.map(s => s.id)) + 1 : 1,
          user_id: user.id,
          plan_id: plan.id,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          is_active: true
        };
        return [...prev, newSub];
      }
    });

    const timestamp = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    // 3. Send Bot Message to User
    const userMsgText = `✅ **پرداخت شما با موفقیت انجام شد!**\n\n` +
      `🔹 محصول: ${category?.name || 'سرویس'}\n` +
      `🔹 پلن: ${plan.title}\n` +
      `🔹 کد پیگیری: \`${refId}\`\n\n` +
      `اطلاعات شما برای ادمین ارسال شد تا دسترسی سازمانی شما فعال گردد.`;

    const userNotif: SystemNotification = {
      id: 'notif-' + Date.now(),
      platform: user.platform,
      chat_id: user.chat_id,
      recipient_type: 'user',
      recipient_name: user.first_name,
      text: userMsgText,
      timestamp: new Date().toISOString(),
      type: 'order_success'
    };

    // 4. Send Bot Message to Admin
    const adminMsgText = `🚨 **خرید جدید انجام شد!**\n\n` +
      `👤 کاربر: ${user.first_name}\n` +
      `📱 شماره تماس: \`${user.phone_number || 'بدون شماره'}\`\n` +
      `💻 پلتفرم: ${user.platform}\n` +
      `🛒 محصول: ${category?.name || 'سرویس'} (${plan.title})\n` +
      `💳 کد پیگیری درگاه: \`${refId}\`\n\n` +
      `⚡️ **اقدام ادمین:** لطفاً دسترسی سازمانی ایشان را دستی فعال کنید.`;

    const adminNotif: SystemNotification = {
      id: 'admin-notif-' + Date.now(),
      platform: 'telegram',
      chat_id: settings.adminChatId,
      recipient_type: 'admin',
      recipient_name: 'ادمین سیستم',
      text: adminMsgText,
      timestamp: new Date().toISOString(),
      type: 'order_success'
    };

    setNotifications(prev => [adminNotif, userNotif, ...prev]);
    setAdminMessages(prev => [{ id: 'adm-' + Date.now(), text: adminMsgText, timestamp }, ...prev]);
  };

  // PayPing Payment Cancel Handler
  const handlePayPingFail = (orderId: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'failed' } : o));
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const user = users.find(u => u.id === order.user_id) || currentUser;
    const failNotif: SystemNotification = {
      id: 'notif-fail-' + Date.now(),
      platform: user.platform,
      chat_id: user.chat_id,
      recipient_type: 'user',
      recipient_name: user.first_name,
      text: '❌ پرداخت شما ناموفق بود یا توسط کاربر لغو شد.',
      timestamp: new Date().toISOString(),
      type: 'order_failed'
    };
    setNotifications(prev => [failNotif, ...prev]);
  };

  // Toggle Subscription Active Status
  const handleToggleSubscription = (subId: number) => {
    setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, is_active: !s.is_active } : s));
  };

  // Extend Subscription Manually
  const handleExtendSubscription = (subId: number, days: number) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === subId) {
        const currentEnd = new Date(s.end_date);
        const base = currentEnd > new Date() ? currentEnd : new Date();
        base.setDate(base.getDate() + days);
        return { ...s, end_date: base.toISOString(), is_active: true };
      }
      return s;
    }));
  };

  // Update Order Status manually
  const handleUpdateOrderStatus = (orderId: number, status: 'pending' | 'success' | 'failed') => {
    if (status === 'success') {
      const refId = 'MANUAL_REF_' + Math.floor(100000 + Math.random() * 900000);
      handlePayPingSuccess(orderId, refId);
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
  };

  // Run Daily Expiration Checks (scheduler/daily_jobs.py)
  const handleRunDailyCron = () => {
    const simulatedNow = new Date();
    simulatedNow.setDate(simulatedNow.getDate() + simulationDayOffset);
    const todayDate = new Date(simulatedNow.toDateString());

    const newCronLogs: CronLog[] = [];
    const newNotifications: SystemNotification[] = [];
    const newAdminMsgs: Array<{ id: string; text: string; timestamp: string }> = [];

    // 1. Check active subscriptions
    subscriptions.filter(s => s.is_active).forEach(sub => {
      const user = users.find(u => u.id === sub.user_id);
      const plan = plans.find(p => p.id === sub.plan_id);
      const category = categories.find(c => c.id === plan?.category_id);
      if (!user || !plan || !category) return;

      const subEndDate = new Date(new Date(sub.end_date).toDateString());
      const daysLeft = Math.ceil((subEndDate.getTime() - todayDate.getTime()) / (1000 * 3600 * 24));
      const timestamp = simulatedNow.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

      // Case 1: Exactly 5 days remaining
      if (daysLeft === 5) {
        const userMsg = `⏳ **یادآوری تمدید اشتراک**\n\nاشتراک ${category.name} شما ۵ روز دیگر به پایان می‌رسد.`;
        const adminMsg = `🔔 **یادآوری ۵ روز:** اشتراک کاربر ${user.first_name} (${user.phone_number || 'بدون شماره'}) ۵ روز دیگر تمام می‌شود.`;

        newNotifications.push({
          id: 'cron-5-' + Date.now() + '-' + sub.id,
          platform: user.platform,
          chat_id: user.chat_id,
          recipient_type: 'user',
          recipient_name: user.first_name,
          text: userMsg,
          timestamp: simulatedNow.toISOString(),
          type: 'expiry_5days'
        });

        newAdminMsgs.push({ id: 'cron-adm-5-' + Date.now() + '-' + sub.id, text: adminMsg, timestamp });

        newCronLogs.push({
          id: 'log-5-' + Date.now() + '-' + sub.id,
          timestamp,
          sub_id: sub.id,
          user_name: user.first_name,
          user_phone: user.phone_number || 'بدون شماره',
          category_name: category.name,
          days_left: 5,
          action_type: '5_days_left',
          message: userMsg
        });
      }

      // Case 2: Exactly 3 days remaining
      else if (daysLeft === 3) {
        const userMsg = `⚠️ **هشدار تمدید اشتراک**\n\nاشتراک ${category.name} شما ۳ روز دیگر به پایان می‌رسد. لطفاً اقدام به تمدید کنید.`;

        newNotifications.push({
          id: 'cron-3-' + Date.now() + '-' + sub.id,
          platform: user.platform,
          chat_id: user.chat_id,
          recipient_type: 'user',
          recipient_name: user.first_name,
          text: userMsg,
          timestamp: simulatedNow.toISOString(),
          type: 'expiry_3days'
        });

        newCronLogs.push({
          id: 'log-3-' + Date.now() + '-' + sub.id,
          timestamp,
          sub_id: sub.id,
          user_name: user.first_name,
          user_phone: user.phone_number || 'بدون شماره',
          category_name: category.name,
          days_left: 3,
          action_type: '3_days_left',
          message: userMsg
        });
      }

      // Case 3: Expired today or earlier (daysLeft <= 0)
      else if (daysLeft <= 0) {
        // Deactivate in DB
        sub.is_active = false;
        const userMsg = `❌ **اتمام اشتراک**\n\nاشتراک ${category.name} شما به پایان رسید.`;

        newNotifications.push({
          id: 'cron-0-' + Date.now() + '-' + sub.id,
          platform: user.platform,
          chat_id: user.chat_id,
          recipient_type: 'user',
          recipient_name: user.first_name,
          text: userMsg,
          timestamp: simulatedNow.toISOString(),
          type: 'expired'
        });

        newCronLogs.push({
          id: 'log-0-' + Date.now() + '-' + sub.id,
          timestamp,
          sub_id: sub.id,
          user_name: user.first_name,
          user_phone: user.phone_number || 'بدون شماره',
          category_name: category.name,
          days_left: daysLeft,
          action_type: 'expired_today',
          message: userMsg
        });
      }
    });

    // Case 4: Expired 2 days ago without renewal
    subscriptions.filter(s => !s.is_active).forEach(sub => {
      const user = users.find(u => u.id === sub.user_id);
      const plan = plans.find(p => p.id === sub.plan_id);
      const category = categories.find(c => c.id === plan?.category_id);
      if (!user || !plan || !category) return;

      const subEndDate = new Date(new Date(sub.end_date).toDateString());
      const daysPassed = Math.ceil((todayDate.getTime() - subEndDate.getTime()) / (1000 * 3600 * 24));
      const timestamp = simulatedNow.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

      if (daysPassed >= 2) {
        // Check if user has bought a new subscription for this category
        const hasNewSub = subscriptions.some(s => {
          if (s.id === sub.id) return false;
          if (s.user_id !== user.id) return false;
          const sPlan = plans.find(p => p.id === s.plan_id);
          return sPlan?.category_id === category.id && s.is_active;
        });

        if (!hasNewSub) {
          const adminAlert = `🛑 **هشدار قطع دسترسی دستی**\n\n` +
            `اشتراک کاربر: ${user.first_name}\n` +
            `شماره تماس: \`${user.phone_number || 'بدون شماره'}\`\n` +
            `محصول: ${category.name}\n\n` +
            `⚠️ این کاربر ۲ روز است که اشتراک خود را تمدید نکرده است. **لطفاً دسترسی سازمانی ایشان را دستی قطع کنید.**`;

          newAdminMsgs.push({ id: 'cron-adm-2d-' + Date.now() + '-' + sub.id, text: adminAlert, timestamp });

          newCronLogs.push({
            id: 'log-2d-' + Date.now() + '-' + sub.id,
            timestamp,
            sub_id: sub.id,
            user_name: user.first_name,
            user_phone: user.phone_number || 'بدون شماره',
            category_name: category.name,
            days_left: -daysPassed,
            action_type: '2_days_overdue_alert',
            message: adminAlert
          });
        }
      }
    });

    if (newCronLogs.length > 0) {
      setCronLogs(prev => [...newCronLogs, ...prev]);
      setNotifications(prev => [...newNotifications, ...prev]);
      setAdminMessages(prev => [...newAdminMsgs, ...prev]);
    } else {
      // Add info log
      setCronLogs(prev => [
        {
          id: 'log-empty-' + Date.now(),
          timestamp: simulatedNow.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          sub_id: 0,
          user_name: 'سیستم',
          user_phone: '—',
          category_name: 'همه اشتراک‌ها',
          days_left: 0,
          action_type: '5_days_left',
          message: 'بررسی روزانه انجام شد؛ هیچ اشتراکی در بازه‌های ۵ روزه، ۳ روزه، انقضای امروز یا ۲ روز پس از انقضا قرار نداشت.'
        },
        ...prev
      ]);
    }

    // Trigger state refresh for subscriptions
    setSubscriptions([...subscriptions]);
  };

  // Advance time helper
  const handleAdvanceDays = (days: number) => {
    setSimulationDayOffset(prev => prev + days);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Vazirmatn',sans-serif]">
      {/* Top Header & Tabs */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={downloadProjectZip}
        pendingOrdersCount={pendingOrdersCount}
        expiringCount={expiringCount}
      />

      {/* Main Tab Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'simplebot' && (
          <SimpleBotView onOpenOnlineAdmin={() => setActiveTab('django')} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            users={users}
            categories={categories}
            plans={plans}
            orders={orders}
            subscriptions={subscriptions}
            notifications={notifications}
            onNavigate={setActiveTab}
            onTriggerDailyCron={handleRunDailyCron}
          />
        )}

        {activeTab === 'bot' && (
          <BotSimulatorView
            users={users}
            categories={categories}
            plans={plans}
            orders={orders}
            subscriptions={subscriptions}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onOpenPayPingModal={handleOpenPayPingModal}
            onUpdateUserPhone={handleUpdateUserPhone}
            adminMessages={adminMessages}
          />
        )}

        {activeTab === 'django' && (
          <DjangoAdminView
            users={users}
            categories={categories}
            plans={plans}
            orders={orders}
            subscriptions={subscriptions}
            onAddCategory={handleAddCategory}
            onAddPlan={handleAddPlan}
            onToggleSubscription={handleToggleSubscription}
            onExtendSubscription={handleExtendSubscription}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'payping' && (
          <PayPingSandboxView
            plans={plans}
            categories={categories}
            users={users}
            orders={orders}
            onTriggerTestPayment={(planId, userId) => {
              const plan = plans.find(p => p.id === planId);
              const cat = categories.find(c => c.id === plan?.category_id);
              if (plan) {
                handleOpenPayPingModal(
                  Math.floor(1000 + Math.random() * 9000),
                  plan.price,
                  plan.title,
                  cat?.name || 'سرویس'
                );
              }
            }}
            onVerifyOrderManually={(orderId) => {
              handleUpdateOrderStatus(orderId, 'success');
            }}
          />
        )}

        {activeTab === 'scheduler' && (
          <SchedulerView
            subscriptions={subscriptions}
            users={users}
            plans={plans}
            categories={categories}
            cronLogs={cronLogs}
            onRunDailyCron={handleRunDailyCron}
            onAdvanceDays={handleAdvanceDays}
            simulationDayOffset={simulationDayOffset}
          />
        )}

        {activeTab === 'code' && (
          <CodeExplorerView onDownloadZip={downloadProjectZip} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}
      </main>

      {/* PayPing IPG Payment Gateway Modal */}
      <PayPingGatewayModal
        isOpen={payModal.isOpen}
        orderId={payModal.orderId}
        amount={payModal.amount}
        planTitle={payModal.planTitle}
        categoryName={payModal.categoryName}
        userPhone={currentUser.phone_number || '09120000000'}
        onClose={() => setPayModal(prev => ({ ...prev, isOpen: false }))}
        onSuccess={handlePayPingSuccess}
        onFail={handlePayPingFail}
      />
    </div>
  );
}
