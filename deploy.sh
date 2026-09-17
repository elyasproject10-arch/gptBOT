#!/bin/bash
set -e

echo "===> Stopping any previous gptbot service..."
systemctl stop gptbot 2>/dev/null || true

echo "===> Installing Python prerequisites..."
apt-get update -y
apt-get install -y python3 python3-pip python3-venv

echo "===> Setting up isolated virtualenv..."
cd /root/gptBOT
rm -rf venv
python3 -m venv venv
/root/gptBOT/venv/bin/pip install --upgrade pip
/root/gptBOT/venv/bin/pip install -r requirements.txt

echo "===> Setting up systemd service..."
cat << 'EOF' > /etc/systemd/system/gptbot.service
[Unit]
Description=Telegram gptBOT Service
After=network.target

[Service]
User=root
WorkingDirectory=/root/gptBOT
ExecStart=/root/gptBOT/venv/bin/python /root/gptBOT/bot.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gptbot
systemctl restart gptbot

echo "===> Service Status:"
systemctl status gptbot --no-pager
