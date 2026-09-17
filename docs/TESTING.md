# Testing Guide

## Test suite

The project ships **182 end-to-end tests** that run against a real MongoDB
instance (via `mongodb-memory-server`) and the real Express app. They cover
authentication, refresh-token rotation + reuse detection, RBAC, object-level
authorization, data isolation, module CRUD, security invariants, and the
role-escalation protections.

### Run

```bash
cd server
npm test
```

No MongoDB install is needed — the test harness spins up an in-memory server.

### What's covered

| Area                    | Tests                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| CSP / security headers  | 5 tests (script-src, no unsafe-inline, no unsafe-eval, connect-src, object-src)                                 |
| Authentication          | login, refresh, logout, expired token, inactive/locked accounts                                                 |
| Refresh rotation        | rotation, reuse detection, family revocation                                                                    |
| RBAC                    | role-based route protection, permission checks                                                                  |
| Object-level authz      | employee sees self only, manager sees team, HR sees all                                                         |
| Data isolation          | cross-role & cross-team denials (403, not data leak)                                                            |
| Module CRUD             | Employees, Leave, Attendance, Payroll, Hiring, Performance, Projects, Documents, Notices, Helpdesk, Offboarding |
| Reports & Analytics     | team-scoped vs company-wide metrics                                                                             |
| Org chart               | role-scoped tree, no sensitive fields exposed                                                                   |
| Users / role management | escalation protections (rules 1–10), last-admin invariant                                                       |
| Audit                   | read-only, HR-only, captures actor + action                                                                     |
| Input validation        | bcrypt hashing, server-computed fields, enum enforcement                                                        |
| Safe error envelopes    | 403/404/400 return friendly messages, no stack traces                                                           |

### Test credentials

```
superadmin@cyethack.com  / Super@123   → SUPER_ADMIN
admin@cyethack.com        / admin123    → ADMIN
hr@cyethack.com           / Hr@123       → HR
manager@cyethack.com      / manager123   → MANAGER (CHS-0004)
employee@cyethack.com     / employee123  → EMPLOYEE (CHS-0008)
```

## Dev server (no MongoDB required)

```bash
cd server
npm run dev:mem      # in-memory MongoDB, seeded, portal + API on :5000
```

## Seeding a real MongoDB

```bash
cd server
npm run seed         # clears + reseeds (development only)
npm start            # run against MONGODB_URI
```

## Frontend

The React client (`client/`) has no standalone test suite in this first pass.
It consumes the backend API via the shared `/api` contract. To run locally:

```bash
cd client
npm run dev          # http://localhost:3000 — proxies /api → http://localhost:5000
```
