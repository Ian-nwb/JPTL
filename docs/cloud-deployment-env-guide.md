# 🌐 Cloud Deployment & Environment Variables Guide (AWS, Vercel, Azure)

This guide details how to configure, adapt, and deploy the JPTL application across **Vercel**, **AWS**, and **Azure**, including an exact reference for every environment variable.

---

## 🏗️ Architecture Overview

The JPTL platform consists of three core applications:

| Application | Technology | Deployed On (Recommended) |
| :--- | :--- | :--- |
| **Client Portal** (`apps/client`) | React 19 + Vite SPA + PWA | **Vercel** / AWS CloudFront + S3 / Azure Static Web Apps |
| **Superadmin Portal** (`apps/superadmin`) | React 19 + Vite SPA | **Vercel** / AWS CloudFront + S3 / Azure Static Web Apps |
| **Backend API Server** (`apps/server`) | Express (Node.js / Bun) | **Vercel (Serverless)** / **AWS** (App Runner / ECS / EC2) / **Azure** / **Render / Railway** |

---

## ✅ Vercel Readiness Checklist

All three applications (`client`, `superadmin`, and `server`) are **Vercel-ready**:

1. **Frontend SPAs (`apps/client` & `apps/superadmin`)**:
   - Each contains a `vercel.json` routing all non-asset requests to `/index.html` to prevent 404s on browser reloads.
   - `apps/client/vercel.json` configures proper `Cache-Control` headers for `sw.js` (must-revalidate) and `manifest.json`.
2. **Backend Express API (`apps/server`)**:
   - **Serverless Entrypoint**: Configured with `apps/server/api/index.js` which wraps the Express `app` in a serverless handler.
   - **Connection Caching**: `src/shared/config/db.js` caches the Mongoose connection across serverless invocations to prevent MongoDB connection pool exhaustion.
   - **Serverless Routing**: `apps/server/vercel.json` rewrites all `/api/*` traffic to the serverless function.
3. **CORS Support**: `apps/server/src/shared/config/cors.js` supports comma-separated origins (`CLIENT_URL`), allowing both the client and superadmin Vercel domains to connect concurrently.
4. **Vercel Deployment Setup**:
   - **Project 1 (`apps/client`)**:
     - **Root Directory**: `apps/client`
     - **Framework Preset**: `Vite`
     - **Build Command**: `vite build`
     - **Output Directory**: `dist`
   - **Project 2 (`apps/superadmin`)**:
     - **Root Directory**: `apps/superadmin`
     - **Framework Preset**: `Vite`
     - **Build Command**: `vite build`
     - **Output Directory**: `dist`
   - **Project 3 (`apps/server`)** *(If deploying backend on Vercel)*:
     - **Root Directory**: `apps/server`
     - **Framework Preset**: `Other` (Node.js Serverless)
     - **Build Command**: Leave empty
     - **Output Directory**: Leave empty

---

## 📋 Environment Variables Matrix

### 1. Client Portal (`apps/client/.env`)

| Variable | Local / Docker | Vercel Deployment | AWS (S3 / CloudFront) | Azure (Static Web Apps) | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `/api` | `https://api.yourdomain.com/api` | `https://api.yourdomain.com/api` | `https://api.yourdomain.com/api` | API backend URL. Set to remote backend URL in cloud deployments. |
| `VITE_APP_ENV` | `development` | `production` | `production` | `production` | Environment mode. |
| `VITE_APP_NAME` | `"JPTL Property Management"` | `"JPTL Property Management"` | `"JPTL Property Management"` | `"JPTL Property Management"` | App title displayed in UI. |
| `VITE_VAPID_PUBLIC_KEY` | *(Same key)* | *(Same key)* | *(Same key)* | *(Same key)* | Public key for browser web push notifications. Must match backend. |
| `VITE_PROXY_TARGET` | `http://localhost:8000` | *Not used in production* | *Not used in production* | *Not used in production* | Only used by Vite local dev server to forward requests. |

---

### 2. Superadmin Portal (`apps/superadmin/.env`)

| Variable | Local / Docker | Vercel Deployment | AWS (S3 / CloudFront) | Azure (Static Web Apps) | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `/api` | `https://api.yourdomain.com/api` | `https://api.yourdomain.com/api` | `https://api.yourdomain.com/api` | API backend URL. |
| `VITE_APP_ENV` | `development` | `production` | `production` | `production` | Environment mode. |
| `VITE_APP_NAME` | `"JPTL Superadmin Console"` | `"JPTL Superadmin Console"` | `"JPTL Superadmin Console"` | `"JPTL Superadmin Console"` | Console branding title. |
| `VITE_PROXY_TARGET` | `http://localhost:8000` | *Not used in production* | *Not used in production* | *Not used in production* | Dev-only proxy target. |

---

### 3. Backend API Server (`apps/server/.env`)

| Variable | Local / Docker | AWS Deployment (App Runner / ECS) | Azure Deployment (App Service / ACA) | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | `8000` | Automatically injected or `80`/`8080` | Automatically injected (`8080`) | Listening port. |
| `NODE_ENV` | `development` | `production` | `production` | Controls cookie `secure` flag and logging verbosity. |
| `ENABLE_CLUSTER` | `true` (or `false`) | `true` (EC2 multi-core) / `false` (App Runner / 1-vCPU ECS) | `false` (Container Apps / App Service) | Avoid process duplication in small containers. |
| `CLIENT_URL` | `http://localhost:5173,http://localhost:5174` | `https://client.vercel.app,https://admin.vercel.app` | `https://client.yourdomain.com,https://admin.yourdomain.com` | Comma-separated list of allowed frontend origins for CORS and reset links. |
| `MONGO_URI` | Atlas or `mongodb://localhost:27017/jptl` | **MongoDB Atlas** or **AWS DocumentDB** | **MongoDB Atlas** or **Azure Cosmos DB (Mongo API)** | MongoDB connection string. |
| `JWT_SECRET` | Dev secret | 64+ char random hex string | 64+ char random hex string | Used to sign JWT auth tokens (`openssl rand -hex 32`). |
| `JWT_EXPIRES_IN` | `7d` | `7d` | `7d` | Session expiration duration. |
| `SMTP_HOST` | `smtp.gmail.com` | `email-smtp.<region>.amazonaws.com` (Amazon SES) | `smtp.sendgrid.net` (SendGrid) | SMTP mail server for password reset & alerts. |
| `SMTP_PORT` | `465` | `465` (SSL) or `587` (TLS) | `587` (TLS) | SMTP server port. |
| `SMTP_SECURE` | `true` | `true` for 465, `false` for 587 | `false` for 587 | Enforces TLS/SSL connection. |
| `SMTP_USER` | Gmail address | Amazon SES SMTP Access Key ID | SendGrid username (`apikey`) | SMTP authentication username. |
| `SMTP_PASS` | Gmail App Password | Amazon SES SMTP Secret Access Key | SendGrid API Key | SMTP authentication password. |
| `SMTP_FROM` | `"JPTL <email>"` | `"JPTL Support <noreply@yourdomain.com>"` | `"JPTL Support <noreply@yourdomain.com>"` | Verified sender header. |
| `CLOUDINARY_*` | Cloudinary credentials | Cloudinary credentials | Cloudinary credentials | Cloud image & document storage. |
| `VAPID_*` | Generated VAPID keys | Same keys across all platforms | Same keys across all platforms | Web Push notification delivery keys. |

---

## 🚀 Cloud Provider Specific Configurations

### Track A: Frontends on Vercel + Backend on AWS App Runner / ECS

1. **Deploy Backend (AWS)**:
   - Create an **AWS App Runner** service or **ECS Fargate Task** pointing to `apps/server/Dockerfile` (or build repository).
   - Set environment variables in the App Runner / ECS console using the AWS column above.
   - Note the assigned domain, e.g. `https://api.yourdomain.com` or `https://xxxxxx.us-east-1.awsapprunner.com`.
2. **Deploy Frontends (Vercel)**:
   - Import repository into Vercel.
   - Set `VITE_API_URL=https://api.yourdomain.com/api` in the Vercel Project Settings > Environment Variables.
   - Redeploy to generate the build with the production API endpoint baked in.
3. **Connect CORS**:
   - Update `CLIENT_URL` on the AWS backend with the resulting Vercel URLs:
     ```env
     CLIENT_URL=https://jptl-client.vercel.app,https://jptl-superadmin.vercel.app,https://yourdomain.com
     ```

---

### Track B: Full Deployment on Azure

1. **Frontends (Azure Static Web Apps)**:
   - Create two Azure Static Web Apps (`jptl-client` and `jptl-superadmin`).
   - App location: `/apps/client` (or `/apps/superadmin`)
   - Output location: `dist`
   - Set Application Setting: `VITE_API_URL=https://jptl-api.azurewebsites.net/api`
2. **Backend (Azure App Service / Azure Container Apps)**:
   - Deploy `apps/server` as a Linux Node 20 LTS or Docker container.
   - Set `ENABLE_CLUSTER=false` (Azure manages scaling via instances).
   - Set `CLIENT_URL` to your Azure Static Web Apps URLs.
   - Set `MONGO_URI` to MongoDB Atlas or Azure Cosmos DB (Mongo API).

---

## 🔒 Security Best Practices for Production

1. **Never Commit Secrets**: Ensure `.env` is listed in `.gitignore` across all subdirectories. Use `.env.example` as a template.
2. **Rotate JWT Secret**: Always use a cryptographically random 64-character hex string in production:
   ```bash
   node -e "console.log(crypto.randomBytes(32).toString('hex'))"
   ```
3. **Database Network Access**:
   - On **MongoDB Atlas**, add your AWS/Azure server's Outbound IP address (or VPC peering/PrivateLink) to the Atlas IP Access List. Never leave `0.0.0.0/0` open permanently in production.
4. **Email Deliverability**:
   - Verify your custom domain and configure **SPF**, **DKIM**, and **DMARC** DNS records in Amazon SES or SendGrid.
