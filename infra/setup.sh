#!/bin/bash
# BlueJoinet VPS Setup Script
# Run once on a fresh Ubuntu 22.04 / Debian 12 VPS.
# Usage: bash setup.sh yourdomain.com your@email.com

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: bash setup.sh <domain> <email>"
  echo "Example: bash setup.sh bluecall.io admin@bluecall.io"
  exit 1
fi

echo "==> Installing Docker..."
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

echo "==> Installing Certbot..."
apt-get install -y certbot

echo "==> Getting SSL certs for $DOMAIN and api.$DOMAIN..."
mkdir -p ssl
certbot certonly --standalone \
  -d $DOMAIN -d www.$DOMAIN \
  --non-interactive --agree-tos -m $EMAIL
certbot certonly --standalone \
  -d api.$DOMAIN \
  --non-interactive --agree-tos -m $EMAIL

echo "==> Symlinking certs..."
mkdir -p ssl/$DOMAIN ssl/api.$DOMAIN
ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/$DOMAIN/fullchain.pem
ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem  ssl/$DOMAIN/privkey.pem
ln -sf /etc/letsencrypt/live/api.$DOMAIN/fullchain.pem ssl/api.$DOMAIN/fullchain.pem
ln -sf /etc/letsencrypt/live/api.$DOMAIN/privkey.pem  ssl/api.$DOMAIN/privkey.pem

echo "==> Updating nginx conf with your domain..."
sed -i "s/yourdomain.com/$DOMAIN/g" nginx/conf.d/web.conf nginx/conf.d/api.conf

echo "==> Opening firewall ports..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3478/udp
ufw allow 3478/tcp
ufw allow 5349/udp
ufw allow 5349/tcp
ufw allow 49152:65535/udp
ufw --force enable

echo ""
echo "==> Done. Next steps:"
echo "   1. Copy .env.example → .env and fill in all values"
echo "   2. cd infra && docker compose up -d --build"
echo ""
