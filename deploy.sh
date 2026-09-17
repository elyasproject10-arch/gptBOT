#!/bin/bash
set -e

echo "===> ۱. توقف سرویس قبلی..."
systemctl stop gptbot 2>/dev/null || true

echo "===> ۲. نصب پکیج‌های سیستمی مورد نیاز اوبونتو..."
apt-get update -y
apt-get install -y python3 python3-pip python3-venv git

echo "===> ۳. راه‌اندازی محیط مجازی ایزوله پایتون (venv)..."
cd /root/gptBOT
rm -rf venv
python3 -m venv venv
/root/gptBOT/venv/bin/pip install --upgrade pip
/root/gptBOT/venv/bin/pip install -r requirements.txt

echo "===> ۴. ساخت سرویس systemd جهت اجرای دائم در پس‌زمینه..."
cat << 'EOF' > /etc/systemd/system/gptbot.service
[Unit]
Description=Telegram gptBOT and Admin Panel Service
After=network.target

[Service]
User=root
WorkingDirectory=/root/gptBOT
ExecStart=/root/gptBOT/venv/bin/python /root/gptBOT/bot.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gptbot
systemctl restart gptbot

echo "========================================================="
echo "✅ تبریک! ربات تلگرام و پنل وب با موفقیت آنلاین شدند."
echo "🔗 آدرس پنل وب ادمین: http://91.107.137.22:8080/admin"
echo "👤 نام کاربری: admin"
echo "🔑 رمز عبور: asd123ASD@#"
echo "========================================================="
systemctl status gptbot --no-pager
