export interface BotUser {
  id: number;
  user_id: number;
  chat_id: number;
  platform: 'telegram' | 'bale';
  first_name: string;
  username?: string;
  phone_number?: string;
  created_at: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  is_active: boolean;
  icon?: string;
  description?: string;
}

export interface Plan {
  id: number;
  category_id: number;
  title: string;
  description: string;
  price: number; // in Tomans
  duration_days: number;
  is_active: boolean;
}

export interface Order {
  id: number;
  user_id: number;
  plan_id: number;
  amount: number; // Tomans
  payping_code?: string;
  ref_id?: string;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  replyMarkup?: {
    inline_keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
    keyboard?: Array<Array<{ text: string; request_contact?: boolean }>>;
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    remove_keyboard?: boolean;
  };
}

export interface SystemNotification {
  id: string;
  platform: 'telegram' | 'bale';
  chat_id: number | string;
  recipient_type: 'user' | 'admin';
  recipient_name: string;
  text: string;
  timestamp: string;
  type: 'order_success' | 'order_failed' | 'expiry_5days' | 'expiry_3days' | 'expired' | 'revoke_alert' | 'general';
}

export interface CronLog {
  id: string;
  timestamp: string;
  sub_id: number;
  user_name: string;
  user_phone: string;
  category_name: string;
  days_left: number;
  action_type: '5_days_left' | '3_days_left' | 'expired_today' | '2_days_overdue_alert';
  message: string;
}

export interface ProjectSettings {
  secretKey: string;
  debug: boolean;
  telegramBotToken: string;
  baleBotToken: string;
  adminChatId: string;
  paypingToken: string;
  paypingGotoUrl: string;
  baseUrl: string;
}
