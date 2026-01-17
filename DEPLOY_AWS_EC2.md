# Deploying to AWS EC2

## EC2 vs Other Platforms

### AWS EC2 Pros:
- ✅ Full control over the server
- ✅ Can be cost-effective (especially with reserved instances)
- ✅ Highly scalable
- ✅ Integrates with other AWS services (RDS, S3, etc.)
- ✅ Good for learning AWS
- ✅ No vendor lock-in

### AWS EC2 Cons:
- ⚠️ More setup required (SSH, security groups, etc.)
- ⚠️ You manage everything (updates, security, monitoring)
- ⚠️ Need to set up SSL/HTTPS yourself
- ⚠️ More complex than managed platforms
- ⚠️ Need to configure reverse proxy (Nginx)

### Comparison:

| Feature | EC2 | Railway | Render | Fly.io |
|---------|-----|---------|--------|--------|
| **Setup Time** | 30-60 min | 5 min | 10 min | 15 min |
| **Management** | You manage | Managed | Managed | Managed |
| **Cost** | $5-20/month | $5-10/month | $7/month | Pay-as-you-go |
| **Control** | Full | Limited | Limited | Limited |
| **SSL** | Manual | Auto | Auto | Auto |
| **Scaling** | Manual/Auto | Auto | Auto | Auto |
| **Learning Curve** | Steep | Easy | Easy | Medium |

---

## When to Use EC2

**Good for:**
- ✅ You want full control
- ✅ You're learning AWS
- ✅ You need to integrate with other AWS services
- ✅ You expect high traffic and want to optimize costs
- ✅ You have DevOps experience

**Not ideal for:**
- ❌ Quick deployment needed
- ❌ You want minimal maintenance
- ❌ Small project with low traffic
- ❌ You prefer managed services

---

## Step-by-Step: Deploy to EC2

### Prerequisites
- AWS account
- AWS CLI installed (optional but helpful)
- SSH key pair

### Step 1: Launch EC2 Instance

1. **Go to AWS Console → EC2**
2. **Click "Launch Instance"**
3. **Configure:**
   - **Name:** `gitgud-server`
   - **AMI:** Ubuntu 22.04 LTS (or Amazon Linux 2023)
   - **Instance Type:** `t3.small` or `t3.medium` (2GB+ RAM recommended)
   - **Key Pair:** Create new or use existing (download `.pem` file)
   - **Network Settings:**
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
     - Allow SSH (port 22) - restrict to your IP
   - **Storage:** 20GB minimum
4. **Launch Instance**

### Step 2: Connect to EC2

```bash
# Make key file executable
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip-address
```

### Step 3: Install Docker on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group (to run without sudo)
sudo usermod -aG docker ubuntu
# Log out and back in for this to take effect

# Verify installation
docker --version
docker-compose --version
```

### Step 4: Clone Your Repository

```bash
# Install Git
sudo apt install git -y

# Clone your repo
git clone https://github.com/your-username/gitgud.git
cd gitgud

# Or use SCP to copy files
# From your local machine:
# scp -i your-key.pem -r . ubuntu@your-ec2-ip:/home/ubuntu/gitgud
```

### Step 5: Set Up Environment Variables

```bash
# Create .env file
nano .env

# Add all your environment variables:
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
SESSION_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
VITE_API_URL=https://api.your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
NODE_ENV=production
```

### Step 6: Install Nginx (Reverse Proxy + SSL)

```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Step 7: Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/gitgud
```

Add this configuration:

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gitgud /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 8: Set Up SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Certbot will automatically update Nginx config for HTTPS
# Certificates auto-renew via cron
```

### Step 9: Update docker-compose.yml for EC2

The current `docker-compose.yml` should work, but you might want to adjust ports:

```yaml
services:
  frontend:
    ports:
      - "127.0.0.1:80:80"  # Only accessible locally (Nginx handles external)
  
  backend:
    ports:
      - "127.0.0.1:3000:3000"  # Only accessible locally
```

### Step 10: Deploy

```bash
# Build and start
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 11: Set Up Auto-Start on Reboot

```bash
# Create systemd service
sudo nano /etc/systemd/system/gitgud.service
```

Add:

```ini
[Unit]
Description=GitGud Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/gitgud
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu
Group=ubuntu

[Install]
WantedBy=multi-user.target
```

```bash
# Enable service
sudo systemctl enable gitgud
sudo systemctl start gitgud
```

---

## Security Best Practices

### 1. Security Groups
- Only allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Restrict SSH to your IP only
- Remove default rules

### 2. Firewall (UFW)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Regular Updates
```bash
# Set up automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Fail2Ban (Protect against brute force)
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

---

## Cost Estimation

**EC2 t3.small (2 vCPU, 2GB RAM):**
- ~$15/month (~$0.0208/hour)
- Can be cheaper with reserved instances

**EC2 t3.medium (2 vCPU, 4GB RAM):**
- ~$30/month (~$0.0416/hour)
- Better for production

**Additional costs:**
- Data transfer: First 1GB free, then ~$0.09/GB
- EBS storage: ~$0.10/GB/month
- **Total: ~$20-40/month** depending on traffic

**vs Railway/Render:**
- Railway: ~$5-10/month
- Render: ~$7/month

**EC2 is more expensive but gives you:**
- Full control
- Better for scaling
- Can optimize costs with reserved instances

---

## Monitoring & Maintenance

### Set Up CloudWatch (AWS Monitoring)

```bash
# Install CloudWatch agent (optional)
# Monitor CPU, memory, disk usage
```

### Set Up Alerts

1. Go to CloudWatch → Alarms
2. Create alarms for:
   - High CPU usage
   - Low disk space
   - Application errors

### Log Management

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Or set up CloudWatch Logs
```

---

## Auto-Scaling (Advanced)

If you need to scale:

1. **Create Launch Template** with your setup
2. **Create Auto Scaling Group**
3. **Set up Load Balancer** (Application Load Balancer)
4. **Configure scaling policies**

This is more complex but allows automatic scaling based on traffic.

---

## Comparison: EC2 vs Managed Platforms

### For Your Use Case:

**Choose EC2 if:**
- ✅ You want to learn AWS
- ✅ You need full control
- ✅ You plan to integrate with other AWS services
- ✅ You have DevOps experience
- ✅ Cost optimization is important at scale

**Choose Railway/Render if:**
- ✅ You want quick deployment
- ✅ You prefer managed services
- ✅ You want minimal maintenance
- ✅ You're okay with less control
- ✅ You want automatic SSL

---

## My Recommendation

**For your project:**

1. **If you're learning/experimenting:** Use **Railway** or **Render**
   - Faster setup
   - Less maintenance
   - Good enough for most use cases

2. **If you want AWS experience:** Use **EC2**
   - Great learning opportunity
   - More control
   - Better for long-term if you'll use more AWS services

3. **If you want best of both:** Use **AWS App Runner** or **ECS Fargate**
   - Managed container service
   - Less setup than EC2
   - Still on AWS

**Quick Decision Guide:**
- **Time to deploy:** Railway (5 min) vs EC2 (30-60 min)
- **Maintenance:** Railway (minimal) vs EC2 (you manage)
- **Cost:** Similar for small scale
- **Control:** EC2 (full) vs Railway (limited)
- **Learning:** EC2 (more) vs Railway (less)

---

## Quick Start Script for EC2

I can create a setup script that automates most of the EC2 setup. Would you like me to create that?
