# Deployment Guide

## Option A: Docker (app + MongoDB)

From the project root:

```bash
# 1. Set strong secrets in a .env next to docker-compose.yml
cp server/.env.example server/.env
#   Edit .env: set real JWT_SECRET, JWT_REFRESH_SECRET, SETUP_TOKEN (≥16 chars)
#   For a quick local trial, the docker-compose defaults use dev secrets.

# 2. Build + run
docker compose up --build
#    → http://localhost:5000  (portal + API)
```

The `uploads/` volume persists uploaded documents across container restarts.

## Option B: Managed host (Render / Railway / VPS)

1. **Database**: create a MongoDB Atlas cluster (or use a managed MongoDB). Allow your
   host's IP. Copy the `mongodb+srv://…` connection string.

2. **Backend** (Node): deploy the `server/` directory.
   ```bash
   npm ci --omit=dev
   npm start
   ```
   Required env vars: `NODE_ENV=production`, `PORT`, `MONGODB_URI`,
   `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `SETUP_TOKEN`.
   The server **refuses to start in production** if secrets are left at defaults or
   `SETUP_TOKEN` is set to the placeholder / shorter than 16 chars.

3. **Frontend** (optional React client): deploy `client/` or serve `client/dist`:
   ```bash
   cd client
   npm ci && npm run build
   # serve client/dist via your static host, or let Express serve server/public/
   ```

4. **HTTPS**: production cookies are `Secure`, so terminate TLS (the platform's TLS,
   or a reverse proxy like nginx/Caddy).

### First user / bootstrap

Production has no dev seed. Create the first admin securely:

```bash
# SETUP_TOKEN must be set in the server environment (≥16 random chars)
SETUP_TOKEN=$(openssl rand -base64 32)
curl -X POST https://hr.yourdomain.com/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "X-Setup-Token: $SETUP_TOKEN" \
  -d '{"fullName":"Your Name","email":"you@company.com","password":"a-strong-password"}'
```

Bootstrap requires **both** an empty user database **and** the correct `SETUP_TOKEN`.
Once the admin is created, provision other users via `POST /api/users` (the admin can
create HR/Admin roles; HR can create non-admin accounts).

**After the first admin exists, blank out `SETUP_TOKEN`** to disable bootstrap entirely.

## Environment variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `NODE_ENV` | Yes | `development` | Set to `production` for prod. |
| `PORT` | No | `5000` | API + portal port. |
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/cyethack_hr` | Atlas or local. |
| `JWT_SECRET` | Yes | Dev default | Long random string. Refuses production start if default. |
| `JWT_REFRESH_SECRET` | Yes | Dev default | Different from access. |
| `ACCESS_TOKEN_EXPIRES_IN` | No | `15m` | Keep short. |
| `REFRESH_TOKEN_EXPIRES_IN` | No | `7d` | Refresh-cookie lifetime. |
| `FRONTEND_URL` | No | `http://localhost:5000` | CORS origin. |
| `SETUP_TOKEN` | No | (empty) | First-admin bootstrap. Leave blank after first admin. Never in frontend code. |
| `MAX_FAILED_LOGINS` | No | `5` | Account lockout threshold. |
| `ACCOUNT_LOCK_MINUTES` | No | `15` | Lockout duration. |
| `BCRYPT_ROUNDS` | No | `12` | Password hash cost. |

Generate secrets: `openssl rand -base64 48`.

## Local (no Docker)

```bash
cd server
cp .env.example .env
# edit .env → set MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, SETUP_TOKEN
npm run seed
npm start
# → http://localhost:5000
```
