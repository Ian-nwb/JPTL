# 🧪 Comprehensive Testing Guide — JPTL Property Management Platform

This document outlines the testing architecture, environment configuration, command-line instructions, and validation procedures across all test categories:

1. **Integration Tests** — Jest + Supertest + MongoDB Memory Server (`apps/server`)
2. **Error-Handling / API Tests** — Postman collections via Newman CLI (root)
3. **Functional & E2E Tests** — Playwright (root)
4. **Load Testing** — ApacheBench (`ab`) via shell script
5. **Database Utilities** — Seed & Purge scripts

> **Note on test runners:** All integration tests run from inside the `apps/server` directory (or via the root delegate). All Postman / Newman, Playwright, and load tests run from the **repository root**.

---

## 🛠️ 1. Prerequisites & Environment Setup

### 1.1 Install Project Dependencies
```bash
# Install root orchestration & testing packages (Playwright, Newman, ZAP client)
npm install

# Install server dependencies (Express, Mongoose, Jest, Supertest)
npm --prefix apps/server install

# Install client dependencies (React, Vite)
npm --prefix apps/client install
```

### 1.2 Install Playwright Browser Engines
```bash
npx playwright install chromium
```

### 1.3 Install Newman (Postman CLI runner)
Newman is already listed as a root `devDependency` and installed via `npm install`. To verify:
```bash
npx newman --version
```

### 1.4 Install ApacheBench (`ab`) for Load Testing
- **Ubuntu / Debian**:
  ```bash
  sudo apt update && sudo apt install -y apache2-utils
  ```
- **macOS**:
  ```bash
  brew install httpd
  ```

---

## 🔗 2. Integration Tests (Jest + Supertest)

Integration tests validate backend controller-service pipelines, database transactions, role-based middleware guards, and cascading deletions using an in-memory MongoDB (`mongodb-memory-server`) with zero external dependencies.

> **⚠️ Known Environment Constraint:** The MongoDB Memory Server requires `libcurl.so.4` which is absent in the Docker `oven/bun` image. Integration tests must be run **outside Docker** directly on the host machine.

### How to Run

```bash
# From the repository root — delegates to apps/server
npm run test:integration

# From apps/server directly
cd apps/server
npm run test:integration

# Run a specific test suite by path
cd apps/server
npx jest src/modules/auth/auth.test.js
npx jest src/modules/landlord/properties/properties.test.js
```

> **Note:** The `--runInBand` flag is already set in the `test:integration` script so tests run sequentially, preventing race conditions on the in-memory database.

### All Integration Test Suites

#### 🔐 Authentication
| File | Tested Endpoints / Features |
| :--- | :--- |
| [`auth/auth.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/auth/auth.test.js) | Landlord registration, duplicate email validation, password hashing, login JWT issuance, password change, logout. |

#### 🏢 Landlord Suites
| File | Tested Endpoints / Features |
| :--- | :--- |
| [`landlord/properties/properties.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/landlord/properties/properties.test.js) | Property CRUD, unit additions, cascade deletion of vacant units. |
| [`landlord/tickets/tickets.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/landlord/tickets/tickets.test.js) | Landlord ticket queue, technician assignment, status transitions, audit logging. |
| [`landlord/rentroll/rentroll.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/landlord/rentroll/rentroll.test.js) | Invoice generation, rent roll summary, mark-as-paid, export, and voiding. |
| [`landlord/tenantdirectory/tenantdirectory.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/landlord/tenantdirectory/tenantdirectory.test.js) | Tenant creation with auto-hashed temp credentials, unit binding, update, deletion. |
| [`landlord/announcements/announcements.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/landlord/announcements/announcements.test.js) | Broadcast creation, tenant feed aggregation, single notice retrieval, 403 role guard. |
| [`landlord/dash/dash.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/landlord/dash/dash.test.js) | Portfolio KPI metrics, tenant overview cards, quick refresh counts. |
| [`landlord/onboarding/onboarding.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/landlord/onboarding/onboarding.test.js) | Setup status, tier selection, initial property + unit creation, welcome broadcast. |
| [`landlord/documents/documents.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/landlord/documents/documents.test.js) | Compliance vault inspection, status verification (`Verified`), deletion. |
| [`landlord/lease/lease.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/landlord/lease/lease.test.js) | Lease extension request review, status approval, automatic unit term extension. |

#### 👤 Tenant Suites
| File | Tested Endpoints / Features |
| :--- | :--- |
| [`tenant/lease/lease.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/tenant/lease/lease.test.js) | Digital lease query, renewal request submission, PDF contract download. |
| [`tenant/documents/documents.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/tenant/documents/documents.test.js) | Document upload (insurance, ID, income), Cloudinary attachment, document listing. |
| [`tenant/payments/payments.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/tenant/payments/payments.test.js) | Ledger & statement query, rent checkout & receipt, auto-pay toggle, saved methods. |
| [`tenant/tickets/tickets.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/tenant/tickets/tickets.test.js) | Maintenance issue submission, status tracking, technician comments, cancellation. |
| [`tenant/dash/dash.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/tenant/dash/dash.test.js) | Tenant dashboard payload, upcoming dues summary, quick KPI metrics. |
| [`tenant/announcements/announcements.test.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/src/modules/tenant/announcements/announcements.test.js) | Notice feed query and single announcement inspection. |

---

## ⚠️ 3. Error-Handling / API Tests (Newman / Postman)

Tests in `tests/*.json` verify that invalid payloads, malformed JSON, missing required fields, non-existent entity IDs, and duplicate unique keys return the correct HTTP status codes and structured error bodies (`{ success: false, message: "..." }`).

### How to Run

```bash
# Run ALL 11 collections sequentially (from repo root)
npm run test:postman

# Or run any single collection individually
npx newman run tests/auth.json
npx newman run tests/properties.json
npx newman run tests/tickets.json
npx newman run tests/lease.json
npx newman run tests/documents.json
npx newman run tests/announcements.json
npx newman run tests/rentroll.json
npx newman run tests/tenantdirectory.json
npx newman run tests/tenantpayments.json
npx newman run tests/onboarding.json
npx newman run tests/dashboard.json
```

> **Prerequisite:** The API server must be running before executing Newman tests.
> ```bash
> npm --prefix apps/server run dev
> # or via Docker:
> docker exec -it server sh
> ```

### What Each Collection Tests

| Collection | Covers |
| :--- | :--- |
| `auth.json` | Invalid credentials, duplicate email, missing required fields |
| `properties.json` | Missing name/address, deleting occupied property (`409`) |
| `tickets.json` | Invalid status enum, unassigned tenant access |
| `lease.json` | Invalid term parameter (≤ 0), extension on non-existent lease |
| `documents.json` | Unauthorized uploads, missing required fields |
| `announcements.json` | Tenant broadcast attempt (`403`), missing title |
| `rentroll.json` | Invalid payment ID, voiding already-paid invoices |
| `tenantdirectory.json` | Creating tenant with duplicate email, missing fields |
| `tenantpayments.json` | Invalid payment method, overpayment guard |
| `onboarding.json` | Checklist skipping guard, missing property on setup |
| `dashboard.json` | Invalid landlord/tenant ID cross-access |

---

## 🧩 4. Functional & E2E Tests (Playwright)

Playwright tests simulate real-world user journeys across both the Landlord Dashboard and Resident Portal.

**Config:** [`playwright.config.js`](file:///home/ian/Desktop/Work/JPTL/playwright.config.js)
- **Base URL:** `http://localhost:5173` (Vite dev server)
- **Browser:** Chromium (Desktop Chrome profile)
- **Test directory:** `./tests/` (root-level)

### How to Run

```bash
# Ensure both servers are running first:
# Terminal 1 — API server:
npm --prefix apps/server run dev

# Terminal 2 — Client dev server:
npm --prefix apps/client run dev

# Terminal 3 — Run all Playwright tests:
npm run test:e2e

# Run with Playwright interactive UI:
npx playwright test --ui

# Run in headed mode (visible Chromium window):
npx playwright test --headed

# Run a specific test file:
npx playwright test tests/auth.spec.js
```

### Key E2E Scenarios
1. **Landlord Journey**: Log in → Create Property → Add Unit → Invite Tenant.
2. **Tenant Journey**: Log in → Review Lease Agreement → Submit Maintenance Ticket → Request 12-Month Extension.
3. **Landlord Resolution**: View incoming ticket → Dispatch technician → Approve renewal → Mark ticket resolved.

---

## ⚡ 5. Load Testing (ApacheBench)

Load tests benchmark server throughput (RPS), latency distributions, and concurrency under high traffic volumes. The server runs on **port 8000** (not 3000).

### How to Run

```bash
# Run default benchmark from repo root (1,000 req, 50 concurrency → http://localhost:8000)
npm run test:load

# Custom parameters: ./scripts/load-test.sh <HOST> <REQUESTS> <CONCURRENCY>
./scripts/load-test.sh http://localhost:8000 5000 100
```

### Direct ApacheBench Commands

```bash
# Health check baseline (1,000 requests, 50 concurrency)
ab -n 1000 -c 50 http://localhost:8000/api/health

# Heavy concurrency test (5,000 requests, 100 concurrency)
ab -n 5000 -c 100 http://localhost:8000/api/health

# Authenticated endpoint load test (using Bearer token header)
ab -n 500 -c 25 -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/api/landlord/properties
```

> **Note:** Use `-H "Authorization: Bearer <token>"` for authenticated endpoints. The `-C` cookie flag in the old guide is not how JPTL's auth works — the server accepts `Bearer` tokens in the `Authorization` header OR an `httpOnly` cookie named `token`.

### Expected Benchmark Thresholds
- **Requests per second (RPS):** `> 800 req/sec` for health/cached endpoints
- **Time per request (mean):** `< 60 ms` at 50 concurrency
- **Failed requests:** `0`

---

## 🌱 6. Database Utilities (Seed & Purge)

These scripts run **inside the Docker server container** (or directly on the host machine if not using Docker). See [`scripts/seed.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/scripts/seed.js) and [`scripts/purge.js`](file:///home/ian/Desktop/Work/JPTL/apps/server/scripts/purge.js).

```bash
# Seed all collections with demo data (idempotent — safe to re-run)
docker exec server npm run seed

# Wipe everything then re-seed from scratch in one shot
docker exec server npm run seed:fresh

# Purge with interactive confirmation prompt
docker exec server npm run purge

# Purge immediately without prompt
docker exec server npm run purge:force
```

### Demo Credentials After Seeding

| Role | Email | Password |
| :--- | :--- | :--- |
| Landlord | `landlord@jptl.dev` | `Password123!` |
| Tenant (Sophia Lin — with parking) | `sophia@jptl.dev` | `Password123!` |
| Tenant (Liam Carter — no parking) | `liam@jptl.dev` | `Password123!` |
| Tenant (David K. Miller — villa) | `david@jptl.dev` | `Password123!` |
| Tenant (Elena Rostova — pending) | `elena@jptl.dev` | `Password123!` |

---

## 🔒 7. Security & Access Control

Security tests verify RBAC middleware guards, JWT authentication, cookie tampering protection, and cross-tenant isolation.

### RBAC Middleware Verification

| Scenario | Expected Response |
| :--- | :--- |
| Tenant hits `GET /api/landlord/dash` | `403 Forbidden` |
| Landlord hits `POST /api/tenant/tickets` | `403 Forbidden` |
| Unauthenticated request (no JWT) | `401 Unauthorized` |
| Landlord queries another landlord's property | `403 Forbidden` / `404 Not Found` |

### Rate Limiting (`express-rate-limit`)

| Limiter | Window | Limit | Routes |
| :--- | :--- | :--- | :--- |
| Global API | 15 min | 300 req/IP | `/api/*` |
| Auth (strict) | 15 min | 20 req/IP | `/api/auth/*` |
| Action (high-cost) | 15 min | 60 req/IP | Payment, document upload |

Exceeding the limit returns `HTTP 429 Too Many Requests`.

### OWASP ZAP Baseline Scan

```bash
# Pull official OWASP ZAP Docker image
docker pull zaproxy/zap-stable

# Run baseline API scan against running backend (port 8000)
docker run -t --net=host zaproxy/zap-stable zap-baseline.py \
  -t http://localhost:8000/api/health \
  -r zap_report.html
```

---

## ⚙️ 8. Multi-Core Clustering (`node:cluster`)

The HTTP backend automatically scales across available CPU cores:

- **Primary Process (Master):** Probes `os.availableParallelism()` / `os.cpus().length` and spawns worker threads.
- **Worker Processes:** Each worker maintains its own DB connection and accepts HTTP on the shared port (`8000`) via kernel round-robin.
- **Self-Healing:** If any worker crashes, the Primary immediately forks a replacement.
- **Environment Variables:**
  - `ENABLE_CLUSTER=false` — Disables clustering (single process, useful for low-memory debugging).
  - `WORKERS=N` — Explicitly sets the number of worker processes (defaults to available CPU cores, capped at 4).

---

## 📋 9. Quick Command Cheat Sheet

| Test Category | Command | Where to Run |
| :--- | :--- | :--- |
| **Integration Tests** | `npm run test:integration` | Repo root or `apps/server` (**host machine only**, not Docker) |
| **All Postman Suites** | `npm run test:postman` | Repo root |
| **Single Postman Suite** | `npx newman run tests/<file>.json` | Repo root |
| **Playwright E2E & Functional** | `npm run test:e2e` | Repo root |
| **Playwright UI Mode** | `npx playwright test --ui` | Repo root |
| **Load Test (default)** | `npm run test:load` | Repo root |
| **Load Test (custom)** | `./scripts/load-test.sh <host> <n> <c>` | Repo root |
| **Run Integration + Postman** | `npm run test:all` | Repo root |
| **Seed DB** | `npm run seed` | `apps/server` / `docker exec server npm run seed` |
| **Fresh Seed (purge + seed)** | `npm run seed:fresh` | `apps/server` / `docker exec server npm run seed:fresh` |
| **Purge DB** | `npm run purge:force` | `apps/server` / `docker exec server npm run purge:force` |
