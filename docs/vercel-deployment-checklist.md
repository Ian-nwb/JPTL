# ⚡ Vercel Deployment Checklist — JPTL (Alternative to AWS)

> **Architectural Note:** Vercel is a **modern Serverless & Edge PaaS alternative** to the self-hosted AWS EC2 + Docker Compose deployment track described in [aws-deployment-checklist.md](file:///home/ian/Desktop/Work/JPTL/docs/aws-deployment-checklist.md).
>
> While AWS EC2 gives you full control over a dedicated virtual machine running Docker containers and Nginx, **Vercel eliminates all server maintenance** (no SSH, no Docker daemon, no Certbot renewal) by deploying applications to a global Edge CDN with automated Git CI/CD.

---

## ⚖️ Deployment Pathway Comparison: AWS vs. Vercel

| Dimension | Track A: AWS Free Tier (EC2 + Docker) | Track B: Vercel Alternative (Serverless / Edge) |
| :--- | :--- | :--- |
| **Hosting Model** | Self-hosted Linux VM (`t2.micro` / `t3.micro`) | Serverless Edge PaaS (Zero server management) |
| **Infrastructure** | Docker Compose + Nginx reverse proxy | Vercel Global Edge Network + Serverless Functions |
| **Maintenance** | Manual (OS security patches, Docker updates, swap memory, certbot renewal) | Zero maintenance (Automated builds, automatic SSL, zero OS administration) |
| **Scaling** | Vertical (Limited to 1 vCPU / 1GB RAM on Free Tier) | Automatic elastic scale per request |
| **Preview Environments** | Manual staging deployment | Automatic preview URLs for every Git branch/PR |
| **Best For** | Full-stack containerized control, long-lived background SSE/workers | Rapid production launches, stakeholder demos, decoupled Jamstack architectures |

---

## 🏗️ Vercel Architecture Blueprint

You can deploy JPTL on Vercel using either of two architectures:

### Architecture 1: Decoupled Jamstack (Recommended for Real-time SSE)
- **Frontends on Vercel:** `apps/client` (Resident & Landlord) and `apps/superadmin` (Superadmin) run on Vercel Edge CDN.
- **Backend on Managed PaaS:** `apps/server` runs on a managed Node platform (Render, Railway, Fly.io) with persistent connection support for live Server-Sent Events (SSE).
- **Database:** Hosted MongoDB Atlas.

```
                          ┌──────────────────────────┐
                          │    Vercel Global Edge    │
                          └─────────────┬────────────┘
                                        │
           ┌────────────────────────────┴───────────────────────────┐
           ▼                                                        ▼
┌──────────────────────┐                                 ┌──────────────────────┐
│  Client Portal (PWA) │                                 │  Superadmin Console  │
│  apps/client         │                                 │  apps/superadmin     │
│  app.yourdomain.com  │                                 │  admin.yourdomain.com│
└──────────┬───────────┘                                 └──────────┬───────────┘
           │                                                        │
           │ HTTPS API Calls (Bearer JWT)                           │
           └────────────────────────────┬───────────────────────────┘
                                        ▼
                         ┌─────────────────────────────┐
                         │   Node.js API Server        │
                         │   (Railway / Render / VM)   │
                         │   https://api.yourdomain.com│
                         └──────────────┬──────────────┘
                                        ▼
                         ┌─────────────────────────────┐
                         │     MongoDB Atlas Cluster   │
                         └─────────────────────────────┘
```

---

## 📋 Phase 1: Pre-Deployment Prerequisites

- [ ] **Vercel Account:** Sign up or log into [vercel.com](https://vercel.com).
- [ ] **GitHub Repository:** Push your latest code to GitHub (`origin/prod` or `main`).
- [ ] **Live Backend API URL:** Verify your backend is live over HTTPS (e.g., `https://api.yourdomain.com/api/health`).
- [ ] **MongoDB Atlas IP Allow-List:** Ensure the backend hosting provider's IP range is permitted in Atlas Network Access (`0.0.0.0/0` with strong authentication for dynamic PaaS IPs).
- [ ] **CORS Configuration:** Verify `apps/server/src/shared/config/cors.js` allows your Vercel domains (`https://*.vercel.app` and custom domains).

---

## 📱 Phase 2: Deploying the Client Portal (`apps/client`)

### 1. New Project in Vercel
1. In the Vercel Dashboard, click **"Add New..."** > **"Project"**.
2. Select the `JPTL` repository and click **Import**.
3. Configure settings:
   - **Project Name:** `jptl-client` (or `jptl-resident-portal`)
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select **`apps/client`**
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`
   - **Install Command:** `bun install` or `npm install`

### 2. Environment Variables
Add the following in Vercel Project Settings > **Environment Variables**:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://api.yourdomain.com/api` | Live backend REST API URL |
| `VITE_VAPID_PUBLIC_KEY` | `BMHMfNcfKqgCSG1I1ikO3Yb...` | Public VAPID key for Web Push notifications |
| `VITE_APP_NAME` | `JPTL Property Management` | Application title |
| `VITE_APP_ENV` | `production` | Environment mode |

### 3. Verification
- [ ] Deploy the project.
- [ ] Verify SPA routing: navigate to `/dashboard` or `/tenant` and refresh page (handled by `apps/client/vercel.json` rewrites).
- [ ] Verify PWA installability: inspect `/manifest.json` and `/sw.js` headers.

---

## 🛡️ Phase 3: Deploying the Superadmin Console (`apps/superadmin`)

### 1. New Project in Vercel
1. Click **"Add New..."** > **"Project"**.
2. Select the same `JPTL` repository and click **Import**.
3. Configure settings:
   - **Project Name:** `jptl-superadmin`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select **`apps/superadmin`**
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`

### 2. Environment Variables
Add the following in Vercel Project Settings > **Environment Variables**:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://api.yourdomain.com/api` | Live backend REST API URL |
| `VITE_APP_NAME` | `JPTL Superadmin Console` | Admin portal title |
| `VITE_APP_ENV` | `production` | Environment mode |

### 3. Verification
- [ ] Deploy the project.
- [ ] Log in with seeded Superadmin credentials: `superadmin@jptl.sys` / `admin123`.
- [ ] Test the **Maintenance Mode Toggle** in the top navigation bar.
- [ ] Verify live CRUD operations for Users, Properties, and Units.

---

## 🌐 Phase 4: Custom Domains & SSL (Zero-Config)

In your domain registrar / DNS manager (Cloudflare, Route 53, Namecheap):

| Type | Name / Host | Value / Target | Notes |
| :--- | :--- | :--- | :--- |
| `CNAME` | `app` | `cname.vercel-dns.com` | Points `app.yourdomain.com` to `jptl-client` |
| `CNAME` | `admin` | `cname.vercel-dns.com` | Points `admin.yourdomain.com` to `jptl-superadmin` |
| `A` / `CNAME` | `api` | Target IP / hostname of backend | Points `api.yourdomain.com` to Node.js backend |

In Vercel:
1. Navigate to **Project Settings** > **Domains**.
2. Add your custom domain to each project.
3. Vercel automatically provisions and auto-renews Let's Encrypt SSL certificates.

---

## 🔒 Phase 5: Backend CORS Allow-List for Vercel

Ensure the backend permits cross-origin requests from your Vercel domains. In `apps/server/src/shared/config/cors.js`:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://app.yourdomain.com',
  'https://admin.yourdomain.com',
  // Allow all Vercel branch preview URLs
  /^https:\/\/.*\.vercel\.app$/,
];
```

---

## 🧪 Phase 6: Post-Deployment Smoke Test Checklist

- [ ] **Resident Login:** Sign in via `sophia@jptl.dev` -> Verify apartment details and rent ledger display.
- [ ] **Landlord Login:** Sign in via `landlord@jptl.dev` -> Broadcast announcement -> Verify push and in-app notifications.
- [ ] **Superadmin Management:** Sign in via `superadmin@jptl.sys` -> Create property & unit -> Check session logs.
- [ ] **Maintenance Mode 503 Gate:**
  1. Toggle Maintenance Mode **ON** in Superadmin Console.
  2. Attempt to view client dashboard in an incognito window: confirm HTTP 503 Maintenance notice.
  3. Toggle Maintenance Mode **OFF** in Superadmin Console.
  4. Confirm normal access is immediately restored.
- [ ] **PWA Offline & Install Test:** Open Chrome/Edge -> Install app via browser prompt -> Verify standalone window launch.
