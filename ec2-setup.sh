#!/bin/bash
# EC2 Setup Script for GitGud
# Run this script on a fresh Ubuntu EC2 instance

set -e

echo "🚀 Setting up GitGud on EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📥 Installing Git..."
sudo apt install git -y

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Install Certbot for SSL
echo "🔒 Installing Certbot..."
sudo apt install certbot python3-certbot-nginx -y

# Install UFW (Firewall)
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Install fail2ban
echo "🛡️ Installing fail2ban..."
sudo apt install fail2ban -y
sudo systemctl enable fail2ban

# Create app directory
echo "📁 Creating app directory..."
mkdir -p ~/gitgud
cd ~/gitgud

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone <your-repo-url> ."
echo "2. Create .env file with your environment variables"
echo "3. Configure Nginx (see DEPLOY_AWS_EC2.md)"
echo "4. Run: docker-compose up -d --build"
echo ""
echo "⚠️  Note: You may need to log out and back in for Docker group changes to take effect"
echo "   Or run: newgrp docker"
