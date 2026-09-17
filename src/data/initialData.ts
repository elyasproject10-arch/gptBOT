import { BotUser, ProductCategory, Plan, Order, Subscription, ProjectSettings } from '../types';

export const initialCategories: ProductCategory[] = [
  {
    id: 1,
    name: 'ChatGPT (OpenAI)',
    is_active: true,
    icon: 'Bot',
    description: 'اکانت پلاس اختصاصی با دسترسی به GPT-4o، قابلیت صوتی و تولید تصویر DALL-E'
  },
  {
    id: 2,
    name: 'Gemini (Google AI)',
    is_active: true,
    icon: 'Sparkles',
    description: 'پلن ادونسد با دسترسی به مدل پرچمدار Gemini 1.5 Pro و ۲ ترابایت فضای ابری گوگل'
  },
  {
    id: 3,
    name: 'Claude (Anthropic)',
    is_active: true,
    icon: 'Brain',
    description: 'اشتراک پرمیوم Claude 3.5 Sonnet با قدرت بالای کدنویسی و تحلیل متون حجیم'
  },
  {
    id: 4,
    name: 'Midjourney',
    is_active: true,
    icon: 'Palette',
    description: 'تولید تصویر نامحدود هوش مصنوعی با بالاترین کیفیت هنری و تجاری'
  }
];

export const initialPlans: Plan[] = [
  {
    id: 1,
    category_id: 1,
    title: '۱ ماهه پلاس اختصاصی',
    description: 'دسترسی کامل ۳۰ روزه به GPT-4o، تحلیل داده و ابزارها',
    price: 1450000,
    duration_days: 30,
    is_active: true
  },
  {
    id: 2,
    category_id: 1,
    title: '۳ ماهه پلاس اقتصادی',
    description: 'تخفیف ویژه دوره‌ای با پشتیبانی بدون قطعی',
    price: 3990000,
    duration_days: 90,
    is_active: true
  },
  {
    id: 3,
    category_id: 2,
    title: '۱ ماهه Gemini Advanced',
    description: 'مدل قدرتمند گوگل جمنای پرو با حافظه طولانی ۱ میلیون توکن',
    price: 1250000,
    duration_days: 30,
    is_active: true
  },
  {
    id: 4,
    category_id: 2,
    title: '۱ ساله سازمانی Gemini',
    description: 'پلن سالانه ویژه شرکت‌ها و تیم‌های توسعه نرم‌افزار',
    price: 11900000,
    duration_days: 365,
    is_active: true
  },
  {
    id: 5,
    category_id: 3,
    title: '۱ ماهه Claude Pro',
    description: '۵ برابر ظرفیت استفاده نسبت به نسخه رایگان کلود',
    price: 1490000,
    duration_days: 30,
    is_active: true
  },
  {
    id: 6,
    category_id: 4,
    title: '۱ ماهه Standard Midjourney',
    description: '۱۵ ساعت تولید در حالت سریع Fast GPU به صورت ماهانه',
    price: 1850000,
    duration_days: 30,
    is_active: true
  }
];

const now = new Date();
const addDays = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const initialUsers: BotUser[] = [
  {
    id: 1,
    user_id: 893421104,
    chat_id: 893421104,
    platform: 'telegram',
    first_name: 'علیرضا',
    username: 'alireza_dev',
    phone_number: '09121112233',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString()
  },
  {
    id: 2,
    user_id: 772391045,
    chat_id: 772391045,
    platform: 'bale',
    first_name: 'سارا رضایی',
    username: 'sara_rezaei',
    phone_number: '09354445566',
    created_at: new Date(Date.now() - 28 * 86400000).toISOString()
  },
  {
    id: 3,
    user_id: 651239912,
    chat_id: 651239912,
    platform: 'telegram',
    first_name: 'محسن کریمی',
    username: 'mohsen_k',
    phone_number: '09197778899',
    created_at: new Date(Date.now() - 32 * 86400000).toISOString()
  },
  {
    id: 4,
    user_id: 541098223,
    chat_id: 541098223,
    platform: 'bale',
    first_name: 'مهدی حسینی',
    username: 'm_hosseini',
    phone_number: '09363334455',
    created_at: new Date(Date.now() - 50 * 86400000).toISOString()
  },
  {
    id: 5,
    user_id: 432190887,
    chat_id: 432190887,
    platform: 'telegram',
    first_name: 'نیلوفر امینی',
    username: 'niloofar_a',
    phone_number: undefined,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

export const initialOrders: Order[] = [
  {
    id: 1001,
    user_id: 1,
    plan_id: 1,
    amount: 1450000,
    payping_code: 'PPG-77812-OK',
    ref_id: 'REF_9918231',
    status: 'success',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    id: 1002,
    user_id: 2,
    plan_id: 3,
    amount: 1250000,
    payping_code: 'PPG-88219-OK',
    ref_id: 'REF_5519283',
    status: 'success',
    created_at: new Date(Date.now() - 27 * 86400000).toISOString()
  },
  {
    id: 1003,
    user_id: 3,
    plan_id: 1,
    amount: 1450000,
    payping_code: 'PPG-44391-OK',
    ref_id: 'REF_1102934',
    status: 'success',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 1004,
    user_id: 4,
    plan_id: 2,
    amount: 3990000,
    payping_code: 'PPG-99381-OK',
    ref_id: 'REF_8819203',
    status: 'success',
    created_at: new Date(Date.now() - 32 * 86400000).toISOString()
  },
  {
    id: 1005,
    user_id: 5,
    plan_id: 3,
    amount: 1250000,
    payping_code: 'PPG-12903-PD',
    ref_id: undefined,
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 3600000).toISOString()
  }
];

export const initialSubscriptions: Subscription[] = [
  {
    id: 1,
    user_id: 1,
    plan_id: 1,
    start_date: new Date(Date.now() - 25 * 86400000).toISOString(),
    end_date: addDays(5), // genau 5 days remaining!
    is_active: true
  },
  {
    id: 2,
    user_id: 2,
    plan_id: 3,
    start_date: new Date(Date.now() - 27 * 86400000).toISOString(),
    end_date: addDays(3), // genau 3 days remaining!
    is_active: true
  },
  {
    id: 3,
    user_id: 3,
    plan_id: 1,
    start_date: new Date(Date.now() - 30 * 86400000).toISOString(),
    end_date: addDays(0), // expires today!
    is_active: true
  },
  {
    id: 4,
    user_id: 4,
    plan_id: 2,
    start_date: new Date(Date.now() - 92 * 86400000).toISOString(),
    end_date: addDays(-2), // expired 2 days ago without renewal! (Triggering manual revoke warning to admin)
    is_active: false
  }
];

export const initialSettings: ProjectSettings = {
  secretKey: 'django-insecure-ai-subscription-secret-key-prod-2026',
  debug: true,
  telegramBotToken: '7123948501:AAHk8Lw194x091Z_TELEGRAM_DEMO_KEY',
  baleBotToken: '1893049102:BBX928174_BALE_MESSENGER_DEMO_KEY',
  adminChatId: '123456789',
  paypingToken: 'payping_bearer_live_prod_991823719028',
  paypingGotoUrl: 'https://api.payping.ir/v2/pay/gotoipg/',
  baseUrl: 'https://ai-subs.example.com'
};
