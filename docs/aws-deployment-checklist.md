# AWS Free Tier Deployment Checklist — JPTL

> This checklist covers deploying JPTL on the AWS Free Tier using EC2 + Docker Compose. MongoDB remains on Atlas (no local DB container needed).

---

## Prerequisites

- [x] AWS account created (12-month free tier eligible)
- [x] MongoDB Atlas cluster ready with connection string
- [x] Domain name (optional but recommended)
- [x] JPTL codebase passing all tests locally

---

## 1. Launch EC2 Instance

- [ ] Sign in to [AWS Console](https://console.aws.amazon.com/)
- [ ] Go to **EC2 → Launch Instance**
- [ ] Select **Amazon Linux 2023** or **Ubuntu 22.04 LTS** AMI (both free-tier eligible)
- [ ] Instance type: **t2.micro** (750 hrs/mo free for 12 months)
- [ ] Create or select a key pair (`.pem` file for SSH)
- [ ] Configure Security Group:

| Type       | Port  | Source    | Purpose                    |
|------------|-------|-----------|----------------------------|
| SSH        | 22    | Your IP   | Remote terminal access     |
| HTTP       | 80    | 0.0.0.0/0 | Frontend (nginx redirect)  |
| HTTPS      | 443   | 0.0.0.0/0 | Frontend (SSL)             |
| Custom TCP | 8000  | 0.0.0.0/0 | Backend API (or proxy via nginx) |
| Custom TCP | 5173  | 0.0.0.0/0 | Client portal (dev only)   |
| Custom TCP | 5174  | 0.0.0.0/0 | Superadmin portal (dev only) |

- [ ] Launch the instance
- [ ] Allocate an **Elastic IP** (1 free) and associate it with the instance

---

## 2. Connect & Install Dependencies

```bash
# SSH into the instance
ssh -i your-key.pem ec2-user@<ELASTIC_IP>

# Update packages
sudo yum update -y        # Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Docker
sudo yum install -y docker   # Amazon Linux
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo yum install -y git   # Amazon Linux
# OR
sudo apt install -y git   # Ubuntu

# Re-login for docker group
exit
ssh -i your-key.pem ec2-user@<ELASTIC_IP>
```

---

## 3. Clone & Configure

```bash
# Clone your repo
git clone https://github.com/<your-org>/JPTL.git
cd JPTL

# Create environment file
cp apps/server/.env.example apps/server/.env
nano apps/server/.env
```

**Required `.env` variables:**
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/jptl
JWT_SECRET=<generate-a-strong-secret>
SUPERADMIN_EMAIL=superadmin@jptl.sys
SUPERADMIN_PASSWORD=<your-secure-password>
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
NODE_ENV=production
PORT=8000
```

---

## 4. Build & Launch with Docker Compose

```bash
# Build and start all services in background
docker compose up -d --build

# Seed the superadmin account
docker compose exec server node scripts/create-superadmin.js

# Verify all containers are running
docker compose ps

# Check logs for errors
docker compose logs -f --tail=50
```

---

## 5. Configure Nginx Reverse Proxy (Optional but Recommended)

```bash
sudo yum install -y nginx  # Amazon Linux
# OR
sudo apt install -y nginx  # Ubuntu

sudo systemctl enable --now nginx
```

**`/etc/nginx/conf.d/jptl.conf`:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Client portal
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Superadmin portal
    location /superadmin/ {
        proxy_pass http://localhost:5174/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. SSL with Let's Encrypt (Free)

```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx  # Amazon Linux
# OR
sudo apt install -y certbot python3-certbot-nginx   # Ubuntu

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renew (certbot adds a systemd timer automatically)
sudo certbot renew --dry-run
```

---

## 7. Atlas IP Whitelisting

- [ ] Go to **MongoDB Atlas → Network Access**
- [ ] Add your EC2 Elastic IP: `<ELASTIC_IP>/32`
- [ ] Or allow from anywhere: `0.0.0.0/0` (less secure, but simpler for dev)

---

## 8. Post-Deployment Verification

- [ ] Open `http://<ELASTIC_IP>:5173` → Client portal loads
- [ ] Open `http://<ELASTIC_IP>:5174` → Superadmin portal loads
- [ ] Open `http://<ELASTIC_IP>:8000/api/docs` → Swagger loads
- [ ] Log in as superadmin → JWT returned
- [ ] Create a test property and unit via superadmin
- [ ] Log in as landlord/tenant → Dashboard loads
- [ ] Create a maintenance ticket → Ticket appears in landlord view
- [ ] Check notifications sidebar → Notifications load
- [ ] PWA install prompt appears on mobile Chrome

---

## 9. Monitoring & Maintenance

```bash
# View live logs
docker compose logs -f

# Restart all services
docker compose restart

# Pull latest code and redeploy
git pull origin main
docker compose up -d --build

# Check disk usage (t2.micro has 8GB EBS by default)
df -h
```

---

## Free Tier Limits to Watch

| Resource | Free Tier Limit | JPTL Usage |
|---|---|---|
| EC2 t2.micro | 750 hrs/mo (1 instance = ~31 days) | ✅ Fits |
| EBS Storage | 30 GB | ✅ ~5-8 GB |
| Data Transfer | 15 GB/mo outbound | ⚠️ Monitor traffic |
| Elastic IP | 1 free (if attached) | ✅ 1 used |
| MongoDB Atlas M0 | 512 MB storage, shared | ✅ Plenty for dev |

> [!WARNING]
> The AWS Free Tier expires after 12 months. After that, a t2.micro costs ~$8.50/mo. Consider switching to **Lightsail** ($3.50/mo) or **Railway/Render** free tier for hobby projects.
