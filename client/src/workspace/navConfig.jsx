/* Single source of truth for the three workspaces. Each entry defines the role
 * set that may enter, the sidebar nav, and the page rendered at each path. The
 * SAME config drives BOTH the sidebar links and the router (see App.jsx), so a
 * menu item and its page can never drift apart. Every page reads a shared,
 * backend-scoped API endpoint — the role decides scope on the server. */
import { COLUMNS } from "../components/columns";
import ResourcePage from "../pages/common/ResourcePage";
import LeavePage from "../pages/common/LeavePage";
import OrgChartPage from "../pages/common/OrgChartPage";
import ProfilePage from "../pages/common/ProfilePage";
import AggregateDashboard from "../pages/dashboards/AggregateDashboard";
import EmployeeDashboard from "../pages/dashboards/EmployeeDashboard";
import UsersPage from "../pages/hr/UsersPage";
import DepartmentsPage from "../pages/hr/DepartmentsPage";
import SettingsPage from "../pages/hr/SettingsPage";
import MyManagerPage from "../pages/employee/MyManagerPage";
import EmploymentDetailsPage from "../pages/employee/EmploymentDetailsPage";
const TEAL = "#509888";

// convenience builders
const list = (title, endpoint, columns, scopeNote, extra = {}) => (
  <ResourcePage
    title={title}
    endpoint={endpoint}
    columns={columns}
    scopeNote={scopeNote}
    {...extra}
  />
);

export const WORKSPACES = {
  hr: {
    key: "hr",
    base: "/hr",
    title: "HR Workspace",
    short: "HR Portal",
    accent: TEAL,
    roles: ["HR", "ADMIN", "SUPER_ADMIN"],
    nav: [
      {
        label: "Dashboard",
        path: "",
        icon: "▦",
        element: (
          <AggregateDashboard
            title="HR Dashboard"
            scopeNote="Company-wide"
            accent={TEAL}
          />
        ),
      },
      {
        label: "Employees",
        path: "employees",
        icon: "👥",
        element: list(
          "Employees",
          "/api/employees",
          COLUMNS.employeesHR,
          "All employees",
        ),
      },
      {
        label: "Managers",
        path: "managers",
        icon: "🧑‍💼",
        element: list(
          "Managers",
          "/api/users",
          COLUMNS.users,
          "Users with the Manager role",
          { filter: (u) => u.role === "MANAGER" },
        ),
      },
      {
        label: "Departments",
        path: "departments",
        icon: "🏢",
        element: <DepartmentsPage />,
      },
      {
        label: "Attendance",
        path: "attendance",
        icon: "🕒",
        element: list(
          "Attendance",
          "/api/attendance",
          COLUMNS.attendance,
          "Company-wide",
        ),
      },
      {
        label: "Leave",
        path: "leave",
        icon: "📅",
        element: (
          <LeavePage title="Leave Management" scopeNote="All requests" />
        ),
      },
      {
        label: "Payroll",
        path: "payroll",
        icon: "💰",
        element: list(
          "Payroll",
          "/api/payroll",
          COLUMNS.payroll,
          "All payslips",
        ),
      },
      {
        label: "Recruitment",
        path: "recruitment",
        icon: "📣",
        element: list(
          "Recruitment",
          "/api/hiring",
          COLUMNS.hiring,
          "Open roles & candidates",
        ),
      },
      {
        label: "Performance",
        path: "performance",
        icon: "📈",
        element: list(
          "Performance",
          "/api/performance",
          COLUMNS.performance,
          "Company-wide",
        ),
      },
      {
        label: "Documents",
        path: "documents",
        icon: "📄",
        element: list(
          "Documents",
          "/api/documents",
          COLUMNS.documents,
          "Company-wide",
        ),
      },
      {
        label: "Projects",
        path: "projects",
        icon: "🗂️",
        element: list(
          "Projects",
          "/api/projects",
          COLUMNS.projects,
          "Company-wide",
        ),
      },
      {
        label: "Helpdesk",
        path: "helpdesk",
        icon: "🎫",
        element: list(
          "Helpdesk",
          "/api/helpdesk",
          COLUMNS.helpdesk,
          "All tickets",
        ),
      },
      {
        label: "Offboarding",
        path: "offboarding",
        icon: "🚪",
        element: list(
          "Offboarding",
          "/api/offboarding",
          COLUMNS.offboarding,
          "Company-wide",
        ),
      },
      {
        label: "Reports",
        path: "reports",
        icon: "📊",
        element: (
          <AggregateDashboard
            title="Reports"
            scopeNote="Company-wide"
            accent={TEAL}
          />
        ),
      },
      {
        label: "Analytics",
        path: "analytics",
        icon: "🔎",
        element: (
          <AggregateDashboard
            title="Analytics"
            scopeNote="Company-wide"
            accent={TEAL}
          />
        ),
      },
      {
        label: "Notices",
        path: "notices",
        icon: "📢",
        element: list(
          "Notice Board",
          "/api/notices",
          COLUMNS.notices,
          "Company announcements",
        ),
      },
      { label: "Users", path: "users", icon: "🔐", element: <UsersPage /> },
      {
        label: "Org Chart",
        path: "org-chart",
        icon: "🌳",
        element: <OrgChartPage />,
      },
      {
        label: "Settings",
        path: "settings",
        icon: "⚙️",
        element: <SettingsPage />,
      },
      {
        label: "My Profile",
        path: "profile",
        icon: "👤",
        element: <ProfilePage />,
      },
    ],
  },

  manager: {
    key: "manager",
    base: "/manager",
    title: "Manager Workspace",
    short: "Manager Portal",
    accent: "#3b82f6",
    roles: ["MANAGER"],
    nav: [
      {
        label: "Dashboard",
        path: "",
        icon: "▦",
        element: (
          <AggregateDashboard
            title="Manager Dashboard"
            scopeNote="Your team only"
            accent="#3b82f6"
          />
        ),
      },
      {
        label: "My Team",
        path: "team",
        icon: "👥",
        element: list(
          "My Team",
          "/api/employees",
          COLUMNS.team,
          "Your direct & indirect reports",
        ),
      },
      {
        label: "Team Attendance",
        path: "attendance",
        icon: "🕒",
        element: list(
          "Team Attendance",
          "/api/attendance",
          COLUMNS.attendance,
          "Your team only",
        ),
      },
      {
        label: "Team Leave",
        path: "leave",
        icon: "📅",
        element: <LeavePage title="Team Leave" scopeNote="Your team only" />,
      },
      {
        label: "Team Performance",
        path: "performance",
        icon: "📈",
        element: list(
          "Team Performance",
          "/api/performance",
          COLUMNS.performance,
          "Your team only",
        ),
      },
      {
        label: "Team Projects",
        path: "projects",
        icon: "🗂️",
        element: list(
          "Team Projects",
          "/api/projects",
          COLUMNS.projects,
          "Your team only",
        ),
      },
      {
        label: "Team Reports",
        path: "reports",
        icon: "📊",
        element: (
          <AggregateDashboard
            title="Team Reports"
            scopeNote="Your team only"
            accent="#3b82f6"
          />
        ),
      },
      {
        label: "Documents",
        path: "documents",
        icon: "📄",
        element: list(
          "Documents",
          "/api/documents",
          COLUMNS.documents,
          "Your team only",
        ),
      },
      {
        label: "Notices",
        path: "notices",
        icon: "📢",
        element: list(
          "Notice Board",
          "/api/notices",
          COLUMNS.notices,
          "Company announcements",
        ),
      },
      {
        label: "Helpdesk",
        path: "helpdesk",
        icon: "🎫",
        element: list("Helpdesk", "/api/helpdesk", COLUMNS.helpdesk, "Tickets"),
      },
      {
        label: "Org Chart",
        path: "org-chart",
        icon: "🌳",
        element: <OrgChartPage />,
      },
      {
        label: "My Profile",
        path: "profile",
        icon: "👤",
        element: <ProfilePage />,
      },
    ],
  },

  employee: {
    key: "employee",
    base: "/employee",
    title: "Employee Workspace",
    short: "Employee Portal",
    accent: "#8b5cf6",
    roles: ["EMPLOYEE"],
    nav: [
      {
        label: "Dashboard",
        path: "",
        icon: "▦",
        element: <EmployeeDashboard />,
      },
      {
        label: "My Employment",
        path: "employment",
        icon: "🧾",
        element: <EmploymentDetailsPage />,
      },
      {
        label: "My Profile",
        path: "profile",
        icon: "👤",
        element: <ProfilePage />,
      },
      {
        label: "My Attendance",
        path: "attendance",
        icon: "🕒",
        element: list(
          "My Attendance",
          "/api/attendance",
          COLUMNS.attendance,
          "Your records",
        ),
      },
      {
        label: "My Leave",
        path: "leave",
        icon: "📅",
        element: <LeavePage title="My Leave" scopeNote="Your requests" />,
      },
      {
        label: "My Payroll",
        path: "payroll",
        icon: "💰",
        element: list(
          "My Payroll",
          "/api/payroll",
          COLUMNS.payroll,
          "Your salary slips",
        ),
      },
      {
        label: "My Documents",
        path: "documents",
        icon: "📄",
        element: list(
          "My Documents",
          "/api/documents",
          COLUMNS.documents,
          "Your documents",
        ),
      },
      {
        label: "My Projects",
        path: "projects",
        icon: "🗂️",
        element: list(
          "My Projects",
          "/api/projects",
          COLUMNS.projects,
          "Your projects",
        ),
      },
      {
        label: "My Performance",
        path: "performance",
        icon: "📈",
        element: list(
          "My Performance",
          "/api/performance",
          COLUMNS.performance,
          "Your reviews",
        ),
      },
      {
        label: "My Manager",
        path: "manager",
        icon: "🧑‍💼",
        element: <MyManagerPage />,
      },
      {
        label: "Notices",
        path: "notices",
        icon: "📢",
        element: list(
          "Notice Board",
          "/api/notices",
          COLUMNS.notices,
          "Company announcements",
        ),
      },
      {
        label: "Helpdesk",
        path: "helpdesk",
        icon: "🎫",
        element: list(
          "My Tickets",
          "/api/helpdesk",
          COLUMNS.helpdesk,
          "Your tickets",
        ),
      },
      {
        label: "Org Chart",
        path: "org-chart",
        icon: "🌳",
        element: <OrgChartPage />,
      },
    ],
  },
};
