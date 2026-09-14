# 🏛️ Architecture Recommendations: Go Fiber Migration & Monorepo Restructuring — JPTL

> **Purpose:** Architectural analysis and migration blueprints for moving the Superadmin module to **Go Fiber** and restructuring the repository into an enterprise-grade clean monorepo.

---

## Part 1: Moving the Superadmin Module to Go Fiber

### 1. Motivation & Technical Justification

The Superadmin module in JPTL currently serves two primary functions:
1. **CRUD Administration:** Unrestricted platform oversight of Users, Properties, and Units.
2. **Live Telemetry & Login Monitoring:** Continuous session tracking and high-frequency real-time Server-Sent Events (SSE) streaming.

| Metric / Dimension | Current Node.js / Express | Proposed Go Fiber Microservice | Impact |
| :--- | :--- | :--- | :--- |
| **Idle Memory Footprint** | ~120MB – 180MB RAM | ~12MB – 25MB RAM | **~85% memory reduction**, optimal for AWS Free Tier (t2.micro / t3.micro with 1GB RAM total) |
| **Concurrent Connections (SSE)** | Event loop overhead per long-lived HTTP connection | Ultra-lightweight Goroutines (~2KB stack per connection) | Supports 10,000+ concurrent active monitors without event loop choking |
| **Request Throughput** | ~2,500 – 4,000 req/sec | ~35,000 – 50,000+ req/sec | Near-native C speed using `fasthttp` under the hood |
| **Binary Deployment** | Heavy `node_modules` (hundreds of MB) | Single statically linked binary (~15MB Docker image via `scratch` or `alpine`) | Rapid deployment, zero dependency drift |

---

### 2. Proposed Go Fiber Service Structure

Place the microservice under `services/superadmin-go` or `apps/superadmin-service`:

```
services/superadmin-go/
├── cmd/
│   └── api/
│       └── main.go                  # Fiber app init, DB connection, routing
├── internal/
│   ├── config/
│   │   └── config.go                # Env variables (PORT, MONGO_URI, JWT_SECRET)
│   ├── database/
│   │   └── mongodb.go               # Official go.mongodb.org/mongo-driver client
│   ├── middleware/
│   │   ├── auth.go                  # JWT validation & Superadmin role assertion
│   │   ├── cors.go                  # CORS configuration
│   │   └── logger.go                # Fiber zerolog / zap logger
│   ├── models/
│   │   ├── session_log.go           # BSON & JSON mapping for session_logs
│   │   ├── user.go                  # BSON mapping for users
│   │   ├── property.go              # BSON mapping for properties
│   │   └── unit.go                  # BSON mapping for units
│   ├── handlers/
│   │   ├── auth_handler.go          # Superadmin login & token generation
│   │   ├── user_handler.go          # Users CRUD
│   │   ├── property_handler.go      # Properties CRUD
│   │   ├── unit_handler.go          # Units CRUD
│   │   └── monitor_handler.go       # SSE / WebSocket live login stream
│   └── services/
│       ├── session_broadcaster.go   # In-memory pub/sub channel for SSE broadcasts
│       └── metrics_service.go       # Real-time memory & latency telemetry
├── go.mod
├── go.sum
└── Dockerfile                       # Multi-stage build (golang:alpine -> scratch)
```

---

### 3. Implementation Blueprint (Key Snippets)

#### Multi-client SSE Broadcaster in Go
```go
package services

import (
    "sync"
    "github.com/gofiber/fiber/v2"
)

type Broadcaster struct {
    clients   map[chan string]bool
    mu        sync.Mutex
    Broadcast chan string
}

var Hub = &Broadcaster{
    clients:   make(map[chan string]bool),
    Broadcast: make(chan string, 100),
}

func (b *Broadcaster) Start() {
    for msg := range b.Broadcast {
        b.mu.Lock()
        for ch := range b.clients {
            select {
            case ch <- msg:
            default:
            }
        }
        b.mu.Unlock()
    }
}
```

#### Multi-Stage Dockerfile (~15MB Image)
```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o superadmin-api ./cmd/api

FROM alpine:3.19
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /app/superadmin-api .
EXPOSE 8081
CMD ["./superadmin-api"]
```

---

### 4. Reverse Proxy Routing (Nginx)

During migration, both Node.js and Go Fiber can co-exist seamlessly behind Nginx:

```nginx
# Core Landlord & Resident API -> Node.js Express (Port 8000)
location /api/ {
    proxy_pass http://localhost:8000;
}

# Superadmin & Live Stream API -> Go Fiber (Port 8081)
location /api/superadmin/ {
    proxy_pass http://localhost:8081;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
    proxy_buffering off; # Required for real-time SSE streaming
    proxy_cache off;
}
```

---

## Part 2: Monorepo Root Restructuring Recommendation

### 1. Current State vs. Pain Points
Currently, the root folder contains:
- `apps/` (client, server, superadmin)
- `microservice/` (experimental stub)
- `plans/` (planning documents)
- `scripts/` (some mixed scripts)
- `tests/` (root-level Postman JSONs & Playwright e2e specs)
- `docs/` (module markdown documentation)
- Ephemeral test reports: `playwright-report/`, `test-results/`

**Key Issues:**
1. Test report folders are not consistently ignored or segregated.
2. Inconsistent naming between `apps/`, `microservice/`, and root services.
3. Node dependencies in root vs. `apps/server` vs. `apps/client` lead to duplicate `package-lock.json` files and tool contention.

---

### 2. Recommended Enterprise Monorepo Architecture

```
JPTL/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Automated Jest, Newman, Playwright runs
│       └── deploy.yml                # AWS EC2 continuous deployment
├── apps/                             # User-Facing & Presentation Frontends
│   ├── client/                       # Landlord & Resident PWA (Vite + React)
│   │   ├── public/                   # manifest.json, icons, sw.js
│   │   └── src/
│   └── superadmin/                   # Root Control Console (Vite + React)
│       └── src/
├── services/                         # Backend APIs & Microservices
│   ├── api-core/                     # Express.js core API (formerly apps/server)
│   │   ├── src/
│   │   │   ├── modules/              # Landlord & Tenant domain modules
│   │   │   └── shared/               # Shared models, middleware, push services
│   │   └── Dockerfile
│   └── superadmin-go/                # (Optional) Go Fiber microservice for Superadmin
├── packages/                         # Shared Internal Configurations & Libraries
│   ├── config-eslint/                # Shared ESLint configuration
│   └── types/                        # Shared TypeScript / JSDoc interfaces
├── deploy/                           # Deployment Infrastructure & Manifests
│   ├── aws/                          # AWS EC2 user-data scripts, systemd units
│   ├── docker/
│   │   ├── docker-compose.yml        # Production stack (Nginx, API, Frontends)
│   │   ├── docker-compose.dev.yml    # Development stack with volume mounts
│   │   └── nginx/
│   │       ├── default.conf          # Reverse proxy config with SSL & SSE support
│   │       └── gzip.conf
│   └── env.example                   # Master environment template
├── docs/                             # Documentation Vault
│   ├── architecture/                 # System design, data models, Go migration
│   ├── deployment/                   # AWS deployment checklist & TLS guide
│   └── guides/                       # Testing guide, onboarding, API reference
├── tests/                            # Global Test Harnesses
│   ├── e2e/                          # Playwright end-to-end user journeys
│   │   └── e2e.spec.js
│   ├── integration/                  # Newman Postman collections (*.json)
│   └── load/                         # ApacheBench / k6 load test scripts
├── scripts/                          # Operational & Maintenance Utilities
│   ├── seed.js                       # Master database seeder
│   ├── purge.js                      # Database reset tool
│   └── create-superadmin.js          # Root credentials generator
├── .gitignore                        # Global ignore patterns
├── package.json                      # Workspaces root (npm workspaces / bun workspaces)
└── README.md                         # Project overview & quick start
```

---

### 3. Step-by-Step Restructuring Roadmap

1. **Phase 1: Housekeeping & Ephemeral Files**
   - Add `playwright-report/`, `test-results/`, and `.superadmin-storage/` to `.gitignore`.
   - Centralize all markdown docs into `docs/`.

2. **Phase 2: Formalize Workspaces in Root `package.json`**
   ```json
   {
     "name": "jptl-monorepo",
     "private": true,
     "workspaces": [
       "apps/*",
       "services/*",
       "packages/*"
     ]
   }
   ```
   This allows running `npm run dev --workspace=client` or `npm run test --workspaces` uniformly from root.

3. **Phase 3: Relocate `microservice/` to `services/`**
   - Standardize all backend processes under `services/`.
   - Prepare `services/superadmin-go` when ready for Golang extraction.

4. **Phase 4: Docker & Infrastructure Consolidation**
   - Move scattered Dockerfiles and configs into `deploy/docker/`.
   - Maintain a single root `docker-compose.yml` that references the organized subpaths.
