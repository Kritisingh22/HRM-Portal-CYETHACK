/* Development seed — creates users for every role plus sample HR data.
 * Run with:  npm run seed
 * DEVELOPMENT ONLY. Passwords here are throwaway dev credentials; never use
 * these in production. */
const cfg = require("../config/env");
const { connectDB, disconnectDB } = require("../config/database");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");
const Hiring = require("../models/Hiring");
const RefreshToken = require("../models/RefreshToken");
const Performance = require("../models/Performance");
const Project = require("../models/Project");
const Document = require("../models/Document");
const Notice = require("../models/Notice");
const Ticket = require("../models/Ticket");
const Offboarding = require("../models/Offboarding");

// dev login accounts (email → role). employeeId links them to an Employee row.
const DEV_USERS = [
  {
    employeeId: null,
    fullName: "System Owner",
    email: "superadmin@cyethack.com",
    role: "SUPER_ADMIN",
    password: "Super@123",
    department: "IT",
  },
  {
    employeeId: null,
    fullName: "Portal Admin",
    email: "admin@cyethack.com",
    role: "ADMIN",
    password: "admin123",
    department: "IT",
  },
  {
    employeeId: "CHS-0001",
    fullName: "Kriti Singh",
    email: "hr@cyethack.com",
    role: "HR",
    password: "Hr@123",
    department: "Human Resources",
    designation: "HR Lead",
  },
  {
    employeeId: "CHS-0004",
    fullName: "Arjun Mehra",
    email: "manager@cyethack.com",
    role: "MANAGER",
    password: "manager123",
    department: "Security Operations",
    designation: "SOC Manager",
  },
  {
    employeeId: "CHS-0008",
    fullName: "Priya Nair",
    email: "employee@cyethack.com",
    role: "EMPLOYEE",
    password: "employee123",
    department: "Engineering",
    designation: "Frontend Developer",
  },
];

// employee directory (mirrors the portal's shape). manager = manager's employeeId.
const EMPLOYEES = [
  {
    employeeId: "CHS-0001",
    fullName: "Kriti Singh",
    email: "kriti.singh@cyethack.com",
    department: "Human Resources",
    designation: "HR Lead",
    manager: null,
    location: "Noida",
    salary: 95000,
    status: "Active",
  },
  {
    employeeId: "CHS-0004",
    fullName: "Arjun Mehra",
    email: "arjun.mehra@cyethack.com",
    department: "Security Operations",
    designation: "SOC Manager",
    manager: "CHS-0001",
    location: "Noida",
    salary: 120000,
    status: "Active",
  },
  {
    employeeId: "CHS-0005",
    fullName: "Rahul Mehta",
    email: "rahul.mehta@cyethack.com",
    department: "Security Operations",
    designation: "Security Analyst",
    manager: "CHS-0004",
    location: "Noida",
    salary: 68000,
    status: "Active",
  },
  {
    employeeId: "CHS-0006",
    fullName: "Sana Kapoor",
    email: "sana.kapoor@cyethack.com",
    department: "Security Operations",
    designation: "Pentester",
    manager: "CHS-0004",
    location: "Remote",
    salary: 72000,
    status: "Active",
  },
  {
    employeeId: "CHS-0007",
    fullName: "Vikram Singh",
    email: "vikram.singh@cyethack.com",
    department: "Engineering",
    designation: "Engineering Lead",
    manager: "CHS-0001",
    location: "Noida",
    salary: 130000,
    status: "Active",
  },
  {
    employeeId: "CHS-0008",
    fullName: "Priya Nair",
    email: "priya.nair@cyethack.com",
    department: "Engineering",
    designation: "Frontend Developer",
    manager: "CHS-0007",
    location: "Remote",
    salary: 78000,
    status: "Active",
  },
  {
    employeeId: "CHS-0009",
    fullName: "Rohit Verma",
    email: "rohit.verma@cyethack.com",
    department: "Engineering",
    designation: "Backend Developer",
    manager: "CHS-0007",
    location: "Noida",
    salary: 82000,
    status: "On Leave",
  },
];

// Seeds an ALREADY-CONNECTED database. Exported so tests can reuse it.
async function seedDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Leave.deleteMany({}),
    Attendance.deleteMany({}),
    Payroll.deleteMany({}),
    Hiring.deleteMany({}),
    RefreshToken.deleteMany({}),
    Performance.deleteMany({}),
    Project.deleteMany({}),
    Document.deleteMany({}),
    Notice.deleteMany({}),
    Ticket.deleteMany({}),
    Offboarding.deleteMany({}),
  ]);

  // employees first
  const empDocs = {};
  for (const e of EMPLOYEES) {
    empDocs[e.employeeId] = await Employee.create(e);
  }

  // users (hashed via the model's virtual), linked to employees where applicable
  const userDocs = {};
  for (const u of DEV_USERS) {
    const attrs = {
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      department: u.department,
      designation: u.designation,
      status: "active",
      isVerified: true,
    };
    if (u.employeeId) attrs.employeeId = u.employeeId; // omit (not null) so the sparse index skips it
    const doc = new User(attrs);
    doc.password = u.password; // hashed on save
    await doc.save();
    userDocs[u.role] = doc;
    if (u.employeeId && empDocs[u.employeeId]) {
      empDocs[u.employeeId].user = doc._id;
      await empDocs[u.employeeId].save();
    }
  }

  // sample leave: one for the manager's team (CHS-0005) and one for the employee (CHS-0008)
  await Leave.create([
    {
      employee: empDocs["CHS-0005"]._id,
      requestedBy: userDocs.MANAGER._id,
      type: "Casual Leave",
      from: "2026-10-20",
      to: "2026-10-21",
      days: 2,
      reason: "Personal",
      status: "Pending",
    },
    {
      employee: empDocs["CHS-0008"]._id,
      requestedBy: userDocs.EMPLOYEE._id,
      type: "Sick Leave",
      from: "2026-10-22",
      to: "2026-10-22",
      days: 1,
      reason: "Fever",
      status: "Pending",
    },
    {
      employee: empDocs["CHS-0006"]._id,
      type: "Earned Leave",
      from: "2026-09-28",
      to: "2026-09-30",
      days: 3,
      reason: "Trip",
      status: "Approved",
    },
  ]);

  // sample attendance
  await Attendance.create([
    {
      employee: empDocs["CHS-0008"]._id,
      date: "2026-09-10",
      status: "present",
      checkIn: "09:05 AM",
    },
    {
      employee: empDocs["CHS-0005"]._id,
      date: "2026-09-10",
      status: "wfh",
      checkIn: "09:30 AM",
    },
  ]);

  // sample payroll (net computed by the model hook)
  await Payroll.create([
    {
      employee: empDocs["CHS-0008"]._id,
      period: "2026-08",
      gross: 78000,
      deductions: { pf: 4680, tds: 6000, esi: 0 },
      status: "Paid",
      payDate: new Date("2026-09-01"),
    },
    {
      employee: empDocs["CHS-0005"]._id,
      period: "2026-08",
      gross: 68000,
      deductions: { pf: 4080, tds: 4200, esi: 0 },
      status: "Approved",
    },
  ]);

  // sample hiring
  await Hiring.create([
    {
      jobId: "JOB-101",
      title: "Security Analyst (L2)",
      department: "Security Operations",
      openings: 2,
      status: "Open",
      createdBy: userDocs.HR._id,
      candidates: [
        {
          name: "Ishaan Malhotra",
          email: "ishaan.m@example.com",
          stage: "Interview",
          source: "LinkedIn",
        },
      ],
    },
    {
      jobId: "JOB-102",
      title: "Frontend Developer",
      department: "Engineering",
      openings: 1,
      status: "Open",
      createdBy: userDocs.HR._id,
      candidates: [],
    },
  ]);

  // sample performance reviews (employee CHS-0008 own; CHS-0005 in manager's team)
  await Performance.create([
    {
      employee: empDocs["CHS-0008"]._id,
      cycle: "2026-H1",
      rating: 4,
      managerFeedback: "Strong delivery on the portal UI.",
      status: "Finalized",
      reviewedBy: userDocs.HR._id,
      goals: [
        {
          title: "Ship dashboard",
          weightage: 40,
          target: "100%",
          achieved: "100%",
          status: "Achieved",
        },
      ],
    },
    {
      employee: empDocs["CHS-0005"]._id,
      cycle: "2026-H1",
      rating: 3,
      managerFeedback: "Good, room to grow on reporting.",
      status: "Submitted",
      reviewedBy: userDocs.MANAGER._id,
    },
  ]);

  // sample projects (managed by the manager CHS-0004, members include employee CHS-0008)
  await Project.create([
    {
      projectId: "PRJ-001",
      name: "SOC Automation",
      status: "Active",
      manager: empDocs["CHS-0004"]._id,
      members: [empDocs["CHS-0005"]._id, empDocs["CHS-0006"]._id],
      progress: 45,
      createdBy: userDocs.HR._id,
      tasks: [{ title: "Alert pipeline", status: "In Progress" }],
    },
    {
      projectId: "PRJ-002",
      name: "HR Portal",
      status: "Active",
      manager: empDocs["CHS-0007"]._id,
      members: [empDocs["CHS-0008"]._id],
      progress: 80,
      createdBy: userDocs.HR._id,
    },
  ]);

  // sample notices
  await Notice.create([
    {
      title: "Diwali Holiday",
      body: "Office closed 1–2 Nov for Diwali.",
      audience: "all",
      pinned: true,
      author: userDocs.HR._id,
    },
    {
      title: "Managers sync",
      body: "Monthly managers review on Friday.",
      audience: "managers",
      author: userDocs.HR._id,
    },
  ]);

  // sample helpdesk ticket raised by the employee
  await Ticket.create([
    {
      subject: "Laptop slow",
      description: "Please check my laptop performance.",
      category: "IT",
      priority: "Medium",
      raisedBy: userDocs.EMPLOYEE._id,
    },
  ]);

  // sample offboarding (initiated for CHS-0009, who is On Leave)
  await Offboarding.create([
    {
      employee: empDocs["CHS-0009"]._id,
      initiatedBy: userDocs.HR._id,
      reason: "Resignation",
      lastWorkingDate: new Date("2026-10-15"),
      status: "In Progress",
    },
  ]);

  return { users: userDocs, employees: empDocs };
}

// CLI runner: connect, seed, print credentials, disconnect.
async function run() {
  if (cfg.isProd && process.env.FORCE_SEED !== "true") {
    console.error(
      "Refusing to seed in production. Set FORCE_SEED=true to override (not recommended).",
    );
    process.exit(1);
  }
  await connectDB();
  console.log("Clearing existing data & seeding…");
  await seedDatabase();
  console.log(
    "\nSeed complete. DEVELOPMENT login accounts (change before real use):\n",
  );
  DEV_USERS.forEach((u) =>
    console.log(
      "  " + u.email.padEnd(30) + u.role.padEnd(13) + "password: " + u.password,
    ),
  );
  console.log(
    "\nEmployees: " +
      EMPLOYEES.length +
      ' | Manager "manager@cyethack.com" manages CHS-0005 & CHS-0006.',
  );
  await disconnectDB();
}

module.exports = { seedDatabase, DEV_USERS, EMPLOYEES };

if (require.main === module) {
  run().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
}
