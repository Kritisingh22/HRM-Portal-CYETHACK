# Architecture

## Overview

```
client/ (React + Vite)                          server/ (Node + Express)
  src/                                          mongoose models
    auth/               AuthContext             controllers  ← enforces RBAC + object-level
      AuthContext.jsx     + token refresh       routes       ← mounts controllers + middleware
      ProtectedRoute.jsx  + role/perm helpers   middleware/  ← authenticate + authorize + error
    services/           api.js (fetch w/
      api.js            auto-refresh)
    components/         Card, Table, Badge,
                        Spinner, Empty, Error   ─── /api/* ──▶
    pages/              Dashboard (per role),      │
                        Employees, Leave, ...      │
    workspace/          Sidebar + layouts          ▼
    styles.css                                    MongoDB
                                                  (or in-memory for tests)
```

The **backend is the security boundary.** Data scoping, role checks, and object-level
authorization are enforced server-side. The frontend guards are UX-only — the API
independently refuses anything a role is not permitted to do.

## Authentication

- **Access tokens**: short-lived JWTs (~15 min), signed with `JWT_SECRET`. Minimal
  payload `{ sub, role }`. Sent as `Authorization: Bearer ...` (in-memory in the React
  client; never stored in localStorage).
- **Refresh tokens**: high-entropy random strings (not JWTs). Only a SHA-256 hash is
  stored in the DB. The raw value lives in an `httpOnly`, `SameSite=strict`, `Secure`
  (production) cookie.
- **Rotation + reuse detection**: each refresh rotates the token (old one revoked, new
  issued in the same "family"). Replaying a rotated token revokes the entire family.
- **Logout**: revokes the refresh-token family server-side and clears the cookie.

## Authorization (RBAC + object-level)

1. `authenticate` middleware verifies the Bearer JWT and attaches `req.user` (loaded from
   the DB — identity always comes from the server, never the client body).
2. `requireRole` / `requirePermission` middleware check capabilities against
   `server/utils/permissions.js`.
3. **Object-level (row-level) scoping** lives in each controller, using the shared
   `server/utils/teamScope.js` helpers so scope logic cannot drift between modules.

### Team-scoping rules

| Role | Employees | Leave | Attendance | Payroll | Performance | Projects | Org Chart |
|------|-----------|-------|------------|---------|-------------|----------|-----------|
| SUPER_ADMIN | All | All | All | All | All | All | Company-wide |
| ADMIN | All | All | All | All | All | All | Company-wide |
| HR | All | All | All | All | All | All | Company-wide |
| MANAGER | Team only | Team only | Team only | Team only | Team only | Team only | Team subtree |
| EMPLOYEE | Self only | Self only | Self only | Self only | Self only | Member-of | Self + chain |

### Role-assignment guards (users API)

The `userController.js` enforces escalation protections:

- Only **SUPER_ADMIN** may assign `SUPER_ADMIN`.
- Only **ADMIN/SUPER_ADMIN** may assign `ADMIN`.
- No one may change their **own** role.
- Only a **SUPER_ADMIN** may modify a `SUPER_ADMIN` account.
- The **last active** SUPER_ADMIN (or last active admin-level account) cannot be
  demoted or deactivated (HTTP 409 Conflict).

## Data isolation

Every query is scoped by the authenticated user's role and team membership at the
**database query level**. The `Employee.manager` field (a string `employeeId`, not an
ObjectId) and the `Employee.user` field (ObjectId → User) are both used for lookups.
`scopeFilter(user)` in `teamScope.js` returns the MongoDB filter for each role tier.

## Security features

- bcrypt password hashing (12 rounds)
- JWT signature + expiry verification
- Refresh-token rotation + revocation + reuse detection
- httpOnly + SameSite=strict cookies (Secure in production)
- Helmet + strict Content-Security-Policy (`script-src 'self'`, no `unsafe-inline`,
  no `unsafe-eval`, `script-src-attr 'none'`)
- CORS configured per `FRONTEND_URL`
- Express `xss-clean`-style input via `express-validator` schema validation
- Mongoose schema validation
- Rate limiting (login, API, bootstrap-admin)
- Account lockout after repeated failed logins
- Salary field omitted (not null) for unauthorized roles
- Centralized error handler returns safe envelopes (no stack traces)
- Audit trail for all privileged actions (immutable via API)

## Frontend architecture

- **AuthContext**: persists session, handles token refresh, exposes `user`, `login`,
  `logout`, `hasRole`, `hasPermission`.
- **ProtectedRoute**: redirects unauthenticated users to `/login`; shows 403 page for
  wrong-role access.
- **Workspaces**: three role-guarded route trees (`/hr`, `/manager`, `/employee`) each
  with its own sidebar nav (driven by `navConfig.jsx`). The same config drives both the
  sidebar and the React Router, so menu items and pages never drift apart.
- **API service** (`services/api.js`): token in memory, auto-refresh on 401 (de-duplicated),
  attaches `Authorization` header to every request.
- **Shared components**: Card, Table (ResourceTable), Modal (ConfirmDialog), Toast,
  StatusPill (StatusPill), Button (Button), Spinner, EmptyState, ErrorNote.

## The existing HTML portal

The original single-file portal (`server/public/index.html`) is preserved unchanged. One
additive script (`server/public/frontend-integration.js`) connects it to the real API:
login, session restore (refresh → /me), role-scoped navigation, real Employees data,
real Dashboard KPIs, and real My-Profile — all without editing the original portal's
markup, CSS, or inline handlers. The demo role-switcher is hidden (the role now comes
from the authenticated user).
