import os
import json
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import config
from .models import Base, Setting, User

os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)

engine = create_engine(
    config.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in config.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    migrate_legacy_json_if_needed()

def migrate_legacy_json_if_needed():
    """انتقال ایمن اطلاعات از فایل‌های JSON به پایگاه داده بدون تخریب"""
    with get_db() as db:
        # تنظیمات
        settings_file = os.path.join(config.BASE_DIR, "settings.json")
        if os.path.exists(settings_file):
            try:
                with open(settings_file, "r", encoding="utf-8") as f:
                    s_data = json.load(f)
                    for k, v in s_data.items():
                        existing = db.query(Setting).filter_by(key=k).first()
                        if not existing:
                            db.add(Setting(key=k, value=json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list, bool)) else str(v)))
            except Exception as e:
                print(f"Error migrating settings.json: {e}")
        
        # پلن‌ها
        plans_file = os.path.join(config.BASE_DIR, "plans.json")
        if os.path.exists(plans_file):
            try:
                with open(plans_file, "r", encoding="utf-8") as f:
                    p_data = json.load(f)
                    existing = db.query(Setting).filter_by(key="plans_data").first()
                    if not existing:
                        db.add(Setting(key="plans_data", value=json.dumps(p_data, ensure_ascii=False)))
            except Exception as e:
                print(f"Error migrating plans.json: {e}")

        # مشترکین
        subs_file = os.path.join(config.BASE_DIR, "subscribers.json")
        if os.path.exists(subs_file):
            try:
                with open(subs_file, "r", encoding="utf-8") as f:
                    subs_data = json.load(f)
                    for uid_str, s in subs_data.items():
                        try:
                            uid = int(uid_str)
                            u = db.query(User).filter_by(telegram_id=uid).first()
                            if not u:
                                u = User(telegram_id=uid, first_name="مشترک قدیمی")
                                db.add(u)
                            u.has_active_sub = s.get("active", False)
                            u.sub_plan = s.get("plan")
                            u.sub_days = s.get("days", 30)
                            u.sub_start_date = s.get("date")
                            u.license_key = s.get("license_key")
                        except Exception:
                            continue
            except Exception as e:
                print(f"Error migrating subscribers.json: {e}")
