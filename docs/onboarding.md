# JPTL — Developer Onboarding

## Prerequisites

Install the following before running the project.

---

### Docker

**Linux**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

**Windows**

Download and install from: https://docs.docker.com/desktop/install/windows-install/

> Requires WSL 2. Enable it first via `wsl --install` in PowerShell (Admin).

---

### Docker Desktop

**Linux**

Download the `.deb` package from: https://docs.docker.com/desktop/install/linux-install/

```bash
sudo apt install ./docker-desktop-<version>-amd64.deb
```

**Windows**

Docker Desktop is included in the Docker installer above. Launch it after install and make sure it's running before using any `docker` commands.

---

### Bun

**Linux**
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

**Windows** (PowerShell)
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify:
```bash
bun --version
```

---

### MongoDB Atlas

JPTL uses MongoDB Atlas as its database — a hosted, third-party service. No local install or container is needed.

Get the connection string from the Atlas dashboard and place it in `apps/server/.env`:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

Make sure your IP is allow-listed in Atlas's Network Access settings, or the connection will time out.

---

## Running the Project

### Full Stack Startup

Starts the frontend and backend together.

```bash
docker compose up -d
```

---

### Manual Setup (First-time, without Docker)

Open **two separate terminals** and run each dev server independently.

**Terminal 1 — Backend**
```bash
cd apps/server
bun install
bun run dev
```

**Terminal 2 — Frontend**
```bash
cd apps/client
bun install
bun run dev
```

### Monitor logs (Docker)

```bash
# Check container status
docker compose ps

# Stream all service logs
docker compose logs -f

# Stream backend server logs
docker compose logs -f server

# Stream superadmin portal logs
docker compose logs -f superadmin

# Stream client portal logs
docker compose logs -f client

# Alternatively using standard docker commands:
docker logs -f server
docker logs -f superadmin
docker logs -f client
```

---

## Default Superadmin Credentials & Portals

| Role / Service | Portal URL | Default Credentials | Description |
|---|---|---|---|
| **Superadmin Portal** | http://localhost:5174 | `superadmin@jptl.sys` / `admin123` | Platform CRUD for Users, Properties, Units & Live Monitoring |
| **Interactive Swagger API** | http://localhost:8000/api/docs | — (Use Bearer token in UI) | Interactive OpenAPI 3.0 API Documentation |
| **Resident & Landlord Portal** | http://localhost:5173 | Seeded users via `npm run seed` | Tenant portal & Landlord dashboard |
| **Backend REST API** | http://localhost:8000 | — | Express + Mongoose API server |

---

## How to Open Swagger API Documentation

1. Start the stack via `docker compose up -d` or start the server via `bun run dev` in `apps/server`.
2. Open your browser and navigate to:
   ```
   http://localhost:8000/api/docs
   ```
3. To authorize requests inside Swagger:
   - Click the **Authorize** button (top-right).
   - Log in via `POST /api/auth/login` or `POST /api/auth/superadmin/login` to obtain your JWT token.
   - Enter `Bearer <token>` and click Authorize.

---

## Ports & Services

| Service | Port | URL | Description |
|---|---|---|---|
| Client Portal | `5173` | http://localhost:5173 | Tenant & Landlord Web Application |
| Superadmin Portal | `5174` | http://localhost:5174 | Superadmin Platform Management |
| Backend Server | `8000` | http://localhost:8000 | REST API Server |
| Swagger API Docs | `8000` | http://localhost:8000/api/docs | Interactive API Docs |
| MongoDB Atlas | — | Hosted Cloud Cluster | Managed Cloud MongoDB |