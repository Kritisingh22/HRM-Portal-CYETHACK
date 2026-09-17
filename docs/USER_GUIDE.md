# User Guide

## Quick start (fastest, no MongoDB install)

```bash
cd server
npm run dev:mem
# open http://localhost:5000
```

Sign in with any dev account:

| Email                     | Password      | Role        |
| ------------------------- | ------------- | ----------- |
| `hr@cyethack.com`         | `Hr@123`      | HR Admin    |
| `manager@cyethack.com`    | `manager123`  | Manager     |
| `employee@cyethack.com`   | `employee123` | Employee    |
| `admin@cyethack.com`      | `admin123`    | Admin       |
| `superadmin@cyethack.com` | `Super@123`   | Super Admin |

## What you see depends on your role

After login you land on the dashboard for **your** role:

- **HR Admin** — full company-wide view: all employees, all leave, payroll, recruitment,
  performance, reports, analytics, org chart, notices, helpdesk, offboarding, settings.
- **Manager** — your team only: your direct & indirect reports, their leave, attendance,
  performance, projects. You can approve/reject your team's leave.
- **Employee** — your personal workspace: your profile, attendance, leave (apply/view),
  payslips, documents, projects, performance, manager, notices, helpdesk, org chart.

## Modules

| Module       | HR                | Manager        | Employee                |
| ------------ | ----------------- | -------------- | ----------------------- |
| Dashboard    | Company KPIs      | Team KPIs      | Personal summary        |
| Employees    | Full directory    | Team only      | Self only               |
| Attendance   | All               | Team           | Self                    |
| Leave        | All + approve     | Team + approve | Apply + own history     |
| Payroll      | All               | —              | Own payslips only       |
| Recruitment  | Full pipeline     | —              | —                       |
| Performance  | All reviews       | Team           | Own                     |
| Projects     | All               | Team           | Member-of               |
| Documents    | All (any file)    | —              | Own + shared            |
| Reports      | Company-wide      | Team-scoped    | —                       |
| Analytics    | Company-wide      | Team-scoped    | —                       |
| Notice Board | Publish + view    | View           | View                    |
| Helpdesk     | See all tickets   | Manage         | Own tickets             |
| Org Chart    | Company tree      | Team subtree   | Self + chain            |
| Offboarding  | Initiate + manage | —              | —                       |
| Settings     | —                 | —              | Role + permissions view |
| My Profile   | Self profile      | Self profile   | Self profile            |

## Two UIs

1. **Existing HTML portal** (default at `http://localhost:5000`) — the original
   single-file design, wired to the real API. Login, session, employees, dashboard,
   profile all hit the real backend.

2. **React client** (optional, at `http://localhost:3000`):
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Proxies `/api` to the server. Has its own role-separated workspaces.

## Security notes

- Your password is **never** stored in plaintext — only a bcrypt hash.
- The refresh token is in an **httpOnly cookie** (not localStorage) — it cannot be read
  by JavaScript, defending against XSS token theft.
- Access tokens expire in 15 minutes. When they do, the app silently refreshes using the
  cookie.
- If you try to access another role's page or another person's record, the server
  returns **403** — even if you craft the URL or API call by hand.
