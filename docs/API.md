# API Reference

All API routes are prefixed with `/api`. The full Express app (portal + API) is served from the server on port 5000.

## Authentication

All endpoints under `/api/auth` use the provided methods. Login and refresh set an **httpOnly, SameSite=strict** cookie named `cyethack_refresh`. Protected endpoints require the access token in the `Authorization: Bearer <token>` header.

### Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | None | Validates email/password, returns `{ accessToken, expiresIn, user, permissions, nav, portal }`. Sets refresh cookie. |
| POST | `/api/auth/refresh` | Cookie only | Rotates the refresh token, returns a new access token. |
| POST | `/api/auth/logout` | Cookie + access | Revokes the refresh-token family, clears cookie. |
| GET | `/api/auth/me` | Access | Returns the authenticated user profile. |
| POST | `/api/auth/change-password` | Access | Verifies current password, sets new, revokes all sessions. |
| POST | `/api/auth/bootstrap-admin` | None* | Creates the **first** admin. Requires `X-Setup-Token` header matching `SETUP_TOKEN` **and** an empty user database. |
| GET | `/api/health` | None | Health check. |

### Response format

```json
{
  "success": true,
  "data": { ... },
  "message": "optional context"
}
```

**Error format** (via centralized error handler):

```json
{
  "error": "Human-readable message",
  "details": [ "optional structured errors" ]
}
```

Errors never leak stack traces or internal details.

### Auth response shape

```json
{
  "accessToken": "eyJ...",
  "expiresIn": "15m",
  "user": {
    "id": "...",
    "name": "Kriti Singh",
    "email": "hr@cyethack.com",
    "role": "HR",
    "department": "Human Resources",
    "designation": "HR Lead",
    "status": "active",
    "permissions": ["employees:read", "employees:write", "..."]
  },
  "nav": ["Dashboard", "Employees", "Attendance", "Leave", "..."],
  "portal": "hr"
}
```

### Roles

`SUPER_ADMIN`, `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`

### Permission model

Permissions are `"<resource>:<action>"` strings. Wildcards (`"*"`, `"resource:*"`) are supported. The full map is in `server/utils/permissions.js`.

| Permission | Roles |
|---|---|
| `employees:write` | HR, ADMIN, SUPER_ADMIN |
| `employees:delete` | HR, ADMIN, SUPER_ADMIN |
| `payroll:read` | HR, ADMIN, SUPER_ADMIN |
| `payroll:write` | HR, ADMIN, SUPER_ADMIN |
| `hiring:write` | HR, ADMIN, SUPER_ADMIN |
| `hiring:delete` | HR, ADMIN, SUPER_ADMIN |
| `reports:read` | HR, ADMIN, SUPER_ADMIN, MANAGER |
| `analytics:read` | HR, ADMIN, SUPER_ADMIN, MANAGER |
| `audit:read` | HR, ADMIN, SUPER_ADMIN |
| `users:manage` | ADMIN, SUPER_ADMIN |

## Employees

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/employees` | Access | — | List (scoped: own/team/all). `?status=`, `?includeExited=true`. |
| GET | `/api/employees/:id` | Access | — | Get one by Mongo `_id` or `employeeId`. |
| POST | `/api/employees` | Access | `employees:write` | Create. |
| PUT | `/api/employees/:id` | Access | `employees:write` | Update. |
| DELETE | `/api/employees/:id` | Access | `employees:delete` | Soft-delete (deactivates login + marks Exited). |
| PUT | `/api/employees/me/profile` | Access | — | Self-service: edit phone/location/address/emergencyContact. |

### Scoping rules

- **HR / Admin / Super Admin**: all employees.
- **Manager**: their direct + indirect reports + themselves.
- **Employee**: themselves only.

### Salary protection

The `salary` field is **omitted** (not null) from responses for any role without `payroll:read`. The property is absent from the JSON entirely.

## Leave

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/leaves` | Access | — | Scoped list. |
| POST | `/api/leaves` | Access | — | Employees file for themselves; others may specify `employee`. |
| PUT | `/api/leaves/:id` | Access | — | Approve/Reject (managers: team only) or Cancel (own). |
| DELETE | `/api/leaves/:id` | Access | `leaves:write` | Delete (HR/Admin only). |

Server computes `days` — client-supplied value is ignored. Rejects reversed date ranges.

## Attendance

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/attendance` | Access | — | Scoped list. |
| POST | `/api/attendance` | Access | `attendance:write` | Upsert by employee+date. |
| PUT | `/api/attendance/:id` | Access | `attendance:write` | Update. |

## Payroll

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/payroll` | Access | — | Scoped list. |
| GET | `/api/payroll/:id` | Access | — | Object-level ownership. |
| POST | `/api/payroll` | Access | `payroll:write` | Create payslip (net auto-computed). |
| PUT | `/api/payroll/:id` | Access | `payroll:write` | Update (deductions deep-merge). |

## Recruitment (Hiring)

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/hiring` | Access | `hiring:read` | List. `?status=`. |
| GET | `/api/hiring/:id` | Access | `hiring:read` | Get one. |
| POST | `/api/hiring` | Access | `hiring:write` | Create. |
| PUT | `/api/hiring/:id` | Access | `hiring:write` | Update. |
| DELETE | `/api/hiring/:id` | Access | `hiring:delete` | Delete. |

## Performance

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/performance` | Access | — | Scoped list. |
| POST | `/api/performance` | Access | `performance:write` | Create (managers: team only). |
| PUT | `/api/performance/:id` | Access | `performance:write` | Update (managers: team only). |

## Projects

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/projects` | Access | — | Scoped (managed-by or member-of). |
| GET | `/api/projects/:id` | Access | — | Object-level access. |
| POST | `/api/projects` | Access | `projects:write` | Create. |
| PUT | `/api/projects/:id` | Access | `projects:write` | Update (managers: own projects). |

## Documents

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/documents` | Access | — | Scoped list. |
| POST | `/api/documents` | Access | — | Multipart upload. Non-HR forced to private + self. |
| GET | `/api/documents/:id/download` | Access | — | Download (authorised). |
| DELETE | `/api/documents/:id` | Access | `documents:delete` | Delete. |

## Notices

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/notices` | Access | — | Audience-scoped. |
| POST | `/api/notices` | Access | `notices:write` | Create. |
| PUT | `/api/notices/:id` | Access | `notices:write` | Update. |
| DELETE | `/api/notices/:id` | Access | `notices:delete` | Delete. |

## Helpdesk

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/helpdesk` | Access | — | Own tickets, or all for support staff. |
| POST | `/api/helpdesk` | Access | — | Raise a ticket. |
| PUT | `/api/helpdesk/:id` | Access | — | Comment / status (owner closes; support staff manage). |

## Offboarding

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/offboarding` | Access | — | Own, or all for HR/Admin. |
| POST | `/api/offboarding` | Access | `offboarding:write` | Initiate. |
| PUT | `/api/offboarding/:id` | Access | `offboarding:write` | Update; `Completed` deactivates the user + marks Exited. |

## Org Chart / Reports / Analytics / Audit / Users

| Method | Route | Auth | Permission | Description |
|--------|-------|------|-----------|-------------|
| GET | `/api/org-chart` | Access | — | Role-scoped tree (safe fields only). |
| GET | `/api/reports/summary` | Access | `reports:read` | Team-scoped for managers, company-wide for HR. |
| GET | `/api/analytics/overview` | Access | `analytics:read` | Team-scoped for managers, company-wide for HR. |
| GET | `/api/audit` | Access | `audit:read` | Read-only audit trail. |
| GET | `/api/users` | Access | — | List users (HR+; managers/employees get 403). |
| POST | `/api/users` | Access | — | Provision user (HR creates non-admin; admin creates admin; super creates super). |
| PUT | `/api/users/:id` | Access | — | Update user (role/scope guards enforced in controller). |
