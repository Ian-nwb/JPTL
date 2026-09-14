# 🧪 Comprehensive Testing Guide — JPTL Property Management Platform

This document outlines the testing architecture, environment configuration, command-line instructions, and validation procedures across all test categories:

1. **Functional Test Cases** — Feature-by-feature behavior across Landlord and Resident portals
2. **Integration Test Cases** — Postman / Newman API collections & Jest + Supertest suites
3. **Error-Handling Test Cases** — Validation, boundary limits, authentication, RBAC, and error payloads
4. **End-to-End Test Scenario** — Full user journeys in Playwright (`tests/e2e.spec.js`)
5. **Load Testing** — ApacheBench (`ab`) throughput and concurrency benchmarks
6. **Database Utilities** — Seed & Purge scripts

> **Note on test runners:** All test commands can now be run from the **repository root** or directly from `apps/server` (delegated scripts are supported in both `package.json` files). Newman tests run against the running backend server on **port 8000**.

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

### 1.3 Verify Newman (Postman CLI Runner)
Newman is installed as a root `devDependency`. Verify installation:
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

## 🎯 2. Functional Test Cases —

Functional test cases validate application business logic, user interface state management, and real-time synchronization between the Landlord Dashboard and Tenant Portal.

### 2.1 Authentication & Registration

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Landlord Sign-In | Valid email (`landlord@jptl.dev`) & password (`Password123!`) | 200 OK. JWT issued in cookie/body, redirected to `/dashboard`. |
| **TC-AUTH-02** | Tenant Sign-In | Valid email (`sophia@jptl.dev`) & password (`Password123!`) | 200 OK. JWT issued, redirected to `/tenant` portal. |
| **TC-AUTH-03** | Phone Country Code API Selector | Search and select from 242 countries (via `https://countriesnow.space/api/v0.1/countries/codes` + bundled fallback) | Search filter dynamically matches name, ISO code, or dial code. Phone input prepends selected dial code with dynamic Unicode flag emoji. |
| **TC-AUTH-04** | Password Toggle Visibility | Click eye/eye-off toggle on password input | Password switches between `type="password"` (masked) and `type="text"` (visible). |
| **TC-AUTH-05** | Form Field Validation | Blur empty required field or input malformed email | Inline error banner highlights invalid field with descriptive message. |

### 2.2 Landlord Onboarding & Portfolio Setup

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-ONBD-01** | Onboarding Status Check | Logged-in landlord with `onboardingCompleted: false` | Lands on `/onboarding` multi-step wizard. |
| **TC-ONBD-02** | Tier Selection | Choose 'Growth' or 'Professional' tier | Tier highlighted, step marked completed. |
| **TC-ONBD-03** | Security Deposit Configuration | Input security deposit amount (e.g., $2,500) | Security deposit captured in payload and stored on property/unit profile. |
| **TC-ONBD-04** | Initial Property & Units Creation | Enter property name, address, unit numbers, and rent amounts | Property and unit records inserted into MongoDB. |
| **TC-ONBD-05** | Onboarding Completion | Submit final step | Landlord status flagged `onboardingCompleted: true`, redirected to `/dashboard`. |

### 2.3 Maintenance Ticketing Lifecycle

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-TICK-01** | Tenant Submit Ticket with Photos | Tenant fills title, category, priority, description, and selects up to 5 images | Photos uploaded (via `POST /api/tenant/tickets/upload-photos`), ticket created with photo URLs, status initialized to `open`. |
| **TC-TICK-02** | Landlord Assigns Technician | Landlord inputs technician name, phone, company, and ETA | Ticket status updates to `in_progress`, `assignedTechnician` embedded on ticket, web push dispatched to tenant. |
| **TC-TICK-03** | Tenant Real-Time Reflection | Landlord assigns technician | Tenant portal displays assigned technician card without manual page reload (polled / push synced). |
| **TC-TICK-04** | Tenant Ticket Deletion | Tenant clicks Delete button on their ticket | Confirmation modal appears; upon confirmation, ticket is deleted from DB and removed from list. |
| **TC-TICK-05** | Landlord Ticket Deletion | Landlord clicks Delete button on any ticket in queue | Confirmation modal appears; ticket deleted via `DELETE /api/landlord/tickets/:id`. |
| **TC-TICK-06** | Ticket Status Transition | Landlord marks ticket as `resolved` | Status badge turns green (`Resolved`), audit log entry recorded. |

### 2.4 Announcements & Push Notifications

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-ANNC-01** | Landlord Broadcast Notice | Landlord fills title, content, category, and toggles `isPinned` | Announcement created (201), pinned to top of feed, VAPID push dispatched to all associated tenants. |
| **TC-ANNC-02** | Tenant Feed Consumption | Tenant views Announcements section | Pinned notices shown first, recent notices ordered chronologically by `createdAt`. |
| **TC-ANNC-03** | Landlord Deletes Announcement | Landlord clicks Delete button on notice | Announcement removed via `DELETE /api/landlord/announcements/:id`, feed updates dynamically. |
| **TC-ANNC-04** | VAPID Key Retrieval | Client requests `GET /api/notifications/vapid-key` | 200 OK. Returns public key for browser ServiceWorker registration. |
| **TC-ANNC-05** | Push Subscription Registration | Browser creates push subscription, sends to `POST /api/notifications/subscribe` | Subscription saved in `PushSubscription` model linked to authenticated user ID. |

### 2.5 Tenant Financial Ledger & Conditional Fees

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-PAY-01** | Parking Fee Conditional Display | Tenant with assigned parking (`sophia@jptl.dev`) views Payments tab | Line item "Parking Space (#P-04) - $150.00" is displayed and included in Total Due. |
| **TC-PAY-02** | Parking Fee Zero/None | Tenant without parking (`liam@jptl.dev`) views Payments tab | Parking fee line item is **hidden** and Total Due only includes base rent. |
| **TC-PAY-03** | Utility Fee Conditional Display | Tenant where `utilityFee === 0` | Water & Sewer / Utilities row is **hidden** from breakdown (only displays if `utilityFee > 0`). |
| **TC-PAY-04** | Pay Rent Submission | Tenant selects saved card or enters payment info | Payment processed, transaction receipt generated, ledger updated. |
| **TC-PAY-05** | Auto-Pay Toggle | Toggle Auto-Pay switch | Auto-pay state updated and persisted on tenant payment settings. |

### 2.6 Tenant Directory & Occupancy Deduplication

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-DIR-01** | Tenant Directory Listing | Landlord views Tenant Directory tab | Each tenant is listed **once** with their primary unit badge (deduplicated display). |
| **TC-DIR-02** | Invite Tenant to Unit | Landlord inputs tenant name, email, phone, and assigns vacant unit | Temp credentials generated, welcome email/payload sent, unit marked occupied. |
| **TC-DIR-03** | Vacate / Remove Tenant | Landlord removes tenant from unit | Unit released to vacant status, lease marked terminated. |

### 2.7 Document Vault & Real File Viewer

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-DOC-01** | Tenant Document Upload | Tenant selects document type and uploads PDF or image | File uploaded to storage (Cloudinary), record added to compliance vault as `Pending`. |
| **TC-DOC-02** | Real Document Inspection | Landlord clicks "Inspect" on tenant document | Document Inspection Modal opens displaying actual document (embedded `<iframe>` for PDFs or `<img>` for images), NOT a generic placeholder. |
| **TC-DOC-03** | Verify / Reject Document | Landlord approves compliance document | Status transitions to `Verified`, status badge updates immediately. |

### 2.8 Superadmin Platform Management

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-SADM-01** | Superadmin Sign-In | Valid email (`superadmin@jptl.sys`) & password (`admin123`) on port 5174 | 200 OK. JWT issued, session log recorded, redirected to Superadmin Root Console. |
| **TC-SADM-02** | Superadmin User Management CRUD | Superadmin creates/updates/deletes a landlord or tenant account | User created/updated in DB; lookup reflects in dropdowns. |
| **TC-SADM-03** | Superadmin Properties CRUD | Superadmin creates, edits, or deletes any property across the system | Property created and linked to selected landlord; changes persist in MongoDB. |
| **TC-SADM-04** | Superadmin Units CRUD | Superadmin creates, assigns, or deletes a unit | Unit linked to target property and optional tenant. Status updates correctly. |
| **TC-SADM-05** | Live Login Monitoring (SSE) | Tenant or landlord logs in on port 5173 | Superadmin Live Monitor tab receives real-time SSE stream event showing email, role, IP, user-agent, and login timestamp without page refresh. |

### 2.9 In-App Notifications Lifecycle

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-NOTIF-01** | Maintenance Notification Dispatch | Landlord creates ticket or updates status | Notification created in DB with type `maintenance`; badge counter increments on tenant sidebar. |
| **TC-NOTIF-02** | Announcement Broadcast Notification | Landlord broadcasts an announcement | Notification created in DB with type `announcement` for all tenants under the landlord. |
| **TC-NOTIF-03** | Mark Single Notification Read | User clicks individual notification item | PATCH `/api/notifications/:id/read` returns 200; unread indicator dot clears. |
| **TC-NOTIF-04** | Mark All Notifications Read | User clicks "Mark all read" button in sidebar | PATCH `/api/notifications/read-all` sets all user notifications to `read: true`; counter resets to 0. |
| **TC-NOTIF-05** | Clear All Notifications | User clicks "Clear All" (Trash icon) in sidebar | DELETE `/api/notifications/clear-all` deletes all notifications for user; list empties. |

### 2.10 Progressive Web App (PWA) Capabilities

| Test ID | Feature / Action | Input / Precondition | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-PWA-01** | Web App Manifest Validation | Navigate to `/manifest.json` | Returns valid JSON with `name`, `short_name`, `theme_color`, `background_color`, `display: standalone`, and icons array. |
| **TC-PWA-02** | Service Worker Registration | Open client portal in browser | `sw.js` registers successfully; offline cache primed for static assets and shell. |
| **TC-PWA-03** | PWA Installability Check | Inspect via Chrome DevTools Lighthouse / Application tab | PWA install criteria passed; browser prompts "Install JPTL" or displays address bar install icon. |

---

## 🔗 3. Integration Test Cases —

Integration tests validate API contract compliance, controller-service workflows, database consistency, and middleware execution across Newman (Postman) collections and Jest + Supertest suites.

### 3.1 Postman / Newman Test Collections

All Postman collections are stored in `tests/*.json`. Run from the repository root with Newman:

```bash
# Run ALL 12 Postman test collections sequentially:
npm run test:postman

# Or execute any specific collection:
npx newman run tests/auth.json
npx newman run tests/dashboard.json
npx newman run tests/onboarding.json
npx newman run tests/properties.json
npx newman run tests/tickets.json
npx newman run tests/announcements.json
npx newman run tests/notifications.json
npx newman run tests/lease.json
npx newman run tests/documents.json
npx newman run tests/rentroll.json
npx newman run tests/tenantdirectory.json
npx newman run tests/tenantpayments.json
```

> **Prerequisite:** Start the backend server before running Newman tests:
> ```bash
> npm --prefix apps/server run dev
> ```

#### Collection Mapping & Covered Endpoints

| Collection File | Method | Target Endpoint | Description | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| `tests/auth.json` | `POST` | `/api/auth/signup` | Landlord registration | `201 Created` |
| `tests/auth.json` | `POST` | `/api/auth/login` | Email/password login & JWT issuance | `200 OK` |
| `tests/auth.json` | `PATCH` | `/api/auth/change-password` | Password modification | `200 OK` |
| `tests/auth.json` | `POST` | `/api/auth/logout` | Session invalidation | `200 OK` |
| `tests/dashboard.json` | `GET` | `/api/landlord/dash` | Landlord portfolio metrics & KPI aggregation | `200 OK` |
| `tests/dashboard.json` | `GET` | `/api/tenant/dash` | Tenant summary cards & upcoming dues | `200 OK` |
| `tests/onboarding.json` | `GET` | `/api/landlord/onboarding/status`| Onboarding wizard progress check | `200 OK` |
| `tests/onboarding.json` | `POST` | `/api/landlord/onboarding/complete`| Onboarding submission (tier, deposit, units) | `201 Created` |
| `tests/properties.json` | `GET/POST` | `/api/landlord/properties` | Property CRUD | `200 / 201` |
| `tests/properties.json` | `POST` | `/api/landlord/properties/:id/units` | Unit creation | `201 Created` |
| `tests/properties.json` | `DELETE` | `/api/landlord/properties/:id/units/:unitId` | Delete vacant unit | `200 OK` |
| `tests/tickets.json` | `POST` | `/api/tenant/tickets` | Tenant issue submission | `201 Created` |
| `tests/tickets.json` | `POST` | `/api/tenant/tickets/upload-photos` | Upload maintenance photos (multipart/form-data) | `200 OK` |
| `tests/tickets.json` | `PATCH` | `/api/landlord/tickets/:id/assign` | Assign technician | `200 OK` |
| `tests/tickets.json` | `PATCH` | `/api/landlord/tickets/:id/status` | Transition ticket status | `200 OK` |
| `tests/tickets.json` | `DELETE` | `/api/tenant/tickets/:id` | Tenant deletes own ticket | `200 OK` |
| `tests/tickets.json` | `DELETE` | `/api/landlord/tickets/:id` | Landlord deletes ticket | `200 OK` |
| `tests/announcements.json` | `GET/POST` | `/api/landlord/announcements` | Landlord broadcast creation & query | `200 / 201` |
| `tests/announcements.json` | `GET` | `/api/tenant/announcements` | Tenant notice feed | `200 OK` |
| `tests/announcements.json` | `DELETE` | `/api/landlord/announcements/:id` | Landlord deletes announcement | `200 OK` |
| `tests/notifications.json` | `GET` | `/api/notifications/vapid-key` | Public VAPID public key query | `200 OK` |
| `tests/notifications.json` | `POST` | `/api/notifications/subscribe` | Register web push subscription | `200 / 201` |
| `tests/documents.json` | `POST` | `/api/tenant/documents` | Upload compliance file | `201 Created` |
| `tests/documents.json` | `PATCH` | `/api/landlord/documents/:id/status`| Verify/reject compliance document | `200 OK` |
| `tests/rentroll.json` | `GET` | `/api/landlord/rentroll` | Rent roll ledger & status filtering | `200 OK` |
| `tests/rentroll.json` | `PATCH` | `/api/landlord/rentroll/:id/mark-paid` | Reconcile invoice to paid | `200 OK` |
| `tests/tenantpayments.json`| `GET` | `/api/tenant/payments` | Ledger breakdown (conditional fees) | `200 OK` |
| `tests/tenantpayments.json`| `POST` | `/api/tenant/payments/pay` | Process payment | `200 OK` |
| `tests/lease.json` | `GET` | `/api/tenant/lease` | Query active digital lease | `200 OK` |
| `tests/lease.json` | `POST` | `/api/tenant/lease/extension` | Submit renewal request | `201 Created` |
| `tests/lease.json` | `PATCH` | `/api/landlord/lease/:id/approve` | Approve lease extension | `200 OK` |

### 3.2 Jest + Supertest In-Memory Integration Suites

Run server integration suites from repo root:
```bash
npm run test:integration
```
Or run a specific module suite:
```bash
npm --prefix apps/server test -- src/modules/auth/auth.test.js
npm --prefix apps/server test -- src/modules/landlord/announcements/announcements.test.js
npm --prefix apps/server test -- src/modules/landlord/tickets/tickets.test.js
npm --prefix apps/server test -- src/modules/tenant/payments/payments.test.js
```

---

## ⚠️ 4. Error-Handling Test Cases —

Negative and boundary test cases verify that the API gracefully rejects malformed inputs, unauthorized callers, cross-tenant leaks, and business invariant violations.

### 4.1 Client Validation & Bad Request (400 Bad Request)

| Test ID | Method & Endpoint | Payload / Scenario | Expected Response & Assertion |
| :--- | :--- | :--- | :--- |
| **TC-ERR-400-01** | `POST /api/auth/signup` | Missing required `email` or `password` | `400 Bad Request` — `{ success: false, message: "..." }` |
| **TC-ERR-400-02** | `POST /api/landlord/announcements` | Missing `title` or empty whitespace string | `400 Bad Request` — `{ success: false, message: "Title and content are required" }` |
| **TC-ERR-400-03** | `PATCH /api/landlord/tickets/:id/status` | Invalid status enum (`status: "invalid_status"`) | `400 Bad Request` — `{ success: false, message: "Invalid status value" }` |
| **TC-ERR-400-04** | `POST /api/tenant/lease/extension` | Extension months ≤ 0 or > 36 | `400 Bad Request` — `{ success: false, message: "Invalid extension period" }` |
| **TC-ERR-400-05** | `POST /api/tenant/payments/pay` | Payment amount ≤ 0 or greater than balance | `400 Bad Request` — `{ success: false, message: "Invalid payment amount" }` |

### 4.2 Authentication Failures (401 Unauthorized)

| Test ID | Method & Endpoint | Scenario | Expected Response & Assertion |
| :--- | :--- | :--- | :--- |
| **TC-ERR-401-01** | `POST /api/auth/login` | Incorrect password or non-existent email | `401 Unauthorized` — `{ success: false, message: "Invalid email or password" }` |
| **TC-ERR-401-02** | `GET /api/landlord/dash` | Request sent with no `Authorization` header and no cookie | `401 Unauthorized` — `{ success: false, message: "Authentication required" }` |
| **TC-ERR-401-03** | `POST /api/notifications/subscribe` | Unauthenticated subscription attempt | `401 Unauthorized` — `{ success: false, message: "Authentication required" }` |
| **TC-ERR-401-04** | `GET /api/auth/me` | Expired or malformed JWT signature | `401 Unauthorized` — `{ success: false, message: "Invalid or expired token" }` |

### 4.3 Role-Based Access Control (403 Forbidden)

| Test ID | Method & Endpoint | Role Used | Expected Response & Assertion |
| :--- | :--- | :--- | :--- |
| **TC-ERR-403-01** | `GET /api/landlord/dash` | Authenticated as `tenant` | `403 Forbidden` — `{ success: false, message: "Forbidden: insufficient permissions" }` |
| **TC-ERR-403-02** | `POST /api/landlord/announcements` | Authenticated as `tenant` | `403 Forbidden` — Tenant cannot publish landlord broadcasts |
| **TC-ERR-403-03** | `DELETE /api/landlord/announcements/:id`| Authenticated as `tenant` | `403 Forbidden` — Tenant cannot delete landlord broadcasts |
| **TC-ERR-403-04** | `POST /api/tenant/tickets` | Authenticated as `landlord` | `403 Forbidden` — Landlord cannot create ticket on tenant route |
| **TC-ERR-403-05** | `DELETE /api/tenant/tickets/:id` | Authenticated as different tenant | `403 Forbidden` / `404 Not Found` — Tenant can only delete own tickets |

### 4.4 Missing Resources & Data Isolation (404 Not Found)

| Test ID | Method & Endpoint | Scenario | Expected Response & Assertion |
| :--- | :--- | :--- | :--- |
| **TC-ERR-404-01** | `GET /api/landlord/tickets/:id` | Query non-existent MongoDB ObjectId (`000000000000000000000000`) | `404 Not Found` — `{ success: false, message: "Ticket not found" }` |
| **TC-ERR-404-02** | `DELETE /api/landlord/announcements/:id`| Delete non-existent announcement ID | `400 / 404` — `{ success: false, message: "Announcement not found or unauthorized" }` |
| **TC-ERR-404-03** | `PATCH /api/landlord/properties/:id` | Update property belonging to another landlord | `404 Not Found` — Cross-landlord isolation enforced |

### 4.5 Business Invariant & Conflict Errors (409 Conflict)

| Test ID | Method & Endpoint | Scenario | Expected Response & Assertion |
| :--- | :--- | :--- | :--- |
| **TC-ERR-409-01** | `POST /api/auth/signup` | Signup with already registered email address | `409 Conflict` — `{ success: false, message: "Email already registered" }` |
| **TC-ERR-409-02** | `DELETE /api/landlord/properties/:id` | Attempt to delete property with active occupied units | `409 Conflict` — `{ success: false, message: "Cannot delete property with active tenants" }` |
| **TC-ERR-409-03** | `DELETE /api/landlord/properties/:id/units/:unitId` | Delete occupied unit | `409 Conflict` — Must vacate unit prior to deletion |

### 4.6 Upload Restrictions (413 & File Filter)

| Test ID | Method & Endpoint | Payload / Scenario | Expected Response & Assertion |
| :--- | :--- | :--- | :--- |
| **TC-ERR-413-01** | `POST /api/tenant/tickets/upload-photos` | Single file exceeds 10MB limit | Multer `LIMIT_FILE_SIZE` error returned |
| **TC-ERR-413-02** | `POST /api/tenant/tickets/upload-photos` | Uploading non-image format (e.g. `.exe`, `.zip`) | `400 Bad Request` — "Only image files are allowed" |
| **TC-ERR-413-03** | `POST /api/tenant/tickets/upload-photos` | Uploading more than 5 photos at once | Multer `LIMIT_UNEXPECTED_FILE` error returned |

### 4.7 Rate Limiting Protection (429 Too Many Requests)

| Limiter Scope | Window | Max Requests | Route Targets |
| :--- | :--- | :--- | :--- |
| **Global API** | 15 minutes | 300 req / IP | `/api/*` |
| **Authentication** | 15 minutes | 20 req / IP | `/api/auth/login`, `/api/auth/signup` |
| **High-Cost Actions** | 15 minutes | 60 req / IP | Payments, Document/Photo uploads |

Exceeding the threshold returns `429 Too Many Requests` with header `Retry-After`.

---

## 🎭 5. End-to-End Test Scenario —

End-to-End tests are implemented in Playwright ([`tests/e2e.spec.js`](file:///home/ian/Desktop/Work/JPTL/tests/e2e.spec.js)). They simulate full user journeys through the browser DOM, asserting UI elements, network requests, modals, and cross-portal updates.

### How to Run Playwright Tests

```bash
# Ensure both servers are running:
# Terminal 1: Backend API (port 8000)
npm --prefix apps/server run dev

# Terminal 2: Frontend Client (port 5173)
npm --prefix apps/client run dev

# Terminal 3: Execute Playwright E2E tests
npm run test:e2e

# Interactive UI Mode (recommended for visual debugging):
npx playwright test --ui

# Headed Mode (watches Chromium in real time):
npx playwright test --headed
```

### 5.1 Scenario 1: Landlord Authentication & Portfolio Overview
1. **Navigate to `/login`**: Ensure `#login-email`, `#login-password`, and Sign In button are visible.
2. **Submit Landlord Credentials**: Fill `landlord@jptl.dev` and `Password123!`.
3. **URL Assertion**: Expect browser redirection to `/dashboard`.
4. **Tab Verification**: Verify tabs for *Dashboard*, *Properties*, *Maintenance / Tickets*, *Rent Roll*, *Tenant Directory*, and *Announcements*.

### 5.2 Scenario 2: Maintenance Request Lifecycle with Photos & Technician
1. **Tenant Logs In**: Sign in as `sophia@jptl.dev` (`Password123!`).
2. **Open Report Issue**: Click "Maintenance" tab → Click "Report Issue" button.
3. **Fill Form**: Enter issue title (*"Kitchen sink leaking"*), select category (*Plumbing*), priority (*High*), description, and attach image.
4. **Submit Ticket**: Assert new ticket appears in the tenant's ticket list.
5. **Landlord Assigns Technician**: Landlord logs in, opens ticket, enters technician details (*Marco Rossi*, *+1 555-0192*, *Apex Plumbing*).
6. **Live Sync to Tenant**: Tenant portal automatically updates (via 10s poll / push) to display assigned technician details.
7. **Ticket Cleanup**: Tenant or Landlord deletes ticket using the newly integrated Delete button.

### 5.3 Scenario 3: Announcement Broadcast, Push Dispatch & Notice Deletion
1. **Landlord Broadcast**: Navigate to Announcements tab → Click "New Announcement".
2. **Notice Details**: Fill title (*"Scheduled Elevator Maintenance"*), content (*"Elevators A and B offline from 1-3 PM"*), toggle Pin to top.
3. **Push Notification**: Web push is dispatched in the background to all active tenant subscriptions.
4. **Tenant Inspection**: Tenant logs in, verifies the pinned announcement card is rendered at the top of the notice feed.
5. **Landlord Deletion**: Landlord clicks Delete on the notice → Confirms deletion modal → Notice is deleted from MongoDB and vanishes from both feeds.

### 5.4 Scenario 4: Financial Breakdown & Conditional Fee Rules
1. **Tenant With Parking (`sophia@jptl.dev`)**:
   - Opens Payments tab.
   - Assert: Base Rent ($2,400) + Parking Space (#P-04, $150) = Total Due ($2,550).
   - Assert: Water & Sewer row is **hidden** because utility fee is 0.
2. **Tenant Without Parking (`liam@jptl.dev`)**:
   - Opens Payments tab.
   - Assert: Parking Space row is **omitted**.
   - Assert: Total Due strictly equals base rent.

---

## ⚡ 6. Load Testing (ApacheBench)

Load tests benchmark server throughput (RPS), latency distributions, and concurrency under traffic spikes. The server runs on **port 8000**.

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

# Authenticated endpoint load test (using Bearer token)
ab -n 500 -c 25 -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8000/api/landlord/properties
```

### Benchmark Targets
- **Requests per second (RPS):** `> 800 req/sec` for health/cached endpoints
- **Time per request (mean):** `< 60 ms` at 50 concurrency
- **Failed requests:** `0`

---

## 🌱 7. Database Utilities (Seed & Purge)

Database scripts run inside the Docker container or on the host machine:

```bash
# Seed all collections with demo data (idempotent — safe to re-run)
npm run seed --prefix apps/server
# or in Docker:
docker exec server npm run seed

# Wipe everything and re-seed in one shot
npm run seed:fresh --prefix apps/server
# or in Docker:
docker exec server npm run seed:fresh

# Purge immediately without interactive prompt
npm run purge:force --prefix apps/server
# or in Docker:
docker exec server npm run purge:force
```

### Seeded Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Landlord** | `landlord@jptl.dev` | `Password123!` | Alexander Vance (Properties, units, active tickets) |
| **Tenant** | `sophia@jptl.dev` | `Password123!` | Sophia Lin (Apt 4B, **with parking $150**, active lease) |
| **Tenant** | `liam@jptl.dev` | `Password123!` | Liam Carter (Unit 201, **no parking**, pending ticket) |
| **Tenant** | `david@jptl.dev` | `Password123!` | David K. Miller (Villa 3, with parking $150) |
| **Tenant** | `elena@jptl.dev` | `Password123!` | Elena Rostova (Unit 102, pending onboarding) |

---

## 📋 8. Quick Command Reference

| Category | Command | Directory / Notes |
| :--- | :--- | :--- |
| **All Postman Suites** | `npm run test:postman` | Repo root (12 collections on port 8000) |
| **Single Postman Suite** | `npx newman run tests/<name>.json` | Repo root |
| **Playwright E2E Suite** | `npm run test:e2e` | Repo root (`tests/e2e.spec.js`) |
| **Playwright UI Debugger** | `npx playwright test --ui` | Repo root |
| **Server Integration** | `npm run test:integration` | Repo root or `apps/server` (host machine) |
| **Load Benchmark** | `npm run test:load` | Repo root (runs against port 8000) |
| **Seed Database** | `npm run seed --prefix apps/server` | Idempotent initial seed |
| **Fresh Reset** | `npm run seed:fresh --prefix apps/server` | Purge + re-seed from scratch |
