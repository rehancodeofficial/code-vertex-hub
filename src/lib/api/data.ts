/**
 * Client-side in-memory + localStorage database.
 * Replaces db.server.ts (file-system) with localStorage persistence.
 * Initialises from mock-data.ts on first load.
 */

import {
  employees as defaultEmployees,
  departments as defaultDepartments,
  attendance as defaultAttendance,
  leaveRequests as defaultLeaves,
  projects as defaultProjects,
  tasks as defaultTasks,
  assets as defaultAssets,
  documents as defaultDocuments,
  notifications as defaultNotifications,
  auditLogs as defaultAuditLogs,
  type Employee,
  type Department,
  type AttendanceRecord,
  type LeaveRequest,
  type Project,
  type Task,
  type Asset,
  type DocumentItem,
  type Notification as NotificationType,
  type AuditLog,
} from "../mock-data";

interface UserCredentials {
  email: string;
  passwordHash: string;
}

export interface DatabaseSchema {
  employees: Employee[];
  departments: Department[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  projects: Project[];
  tasks: Task[];
  assets: Asset[];
  documents: DocumentItem[];
  notifications: NotificationType[];
  auditLogs: AuditLog[];
  credentials: UserCredentials[];
}

const DB_KEY = "vertex_ems_db";

// Simple demo password hash
function hashPwd(pwd: string): string {
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    hash = (hash << 5) - hash + pwd.charCodeAt(i);
    hash |= 0;
  }
  return `demo_${hash}`;
}

function buildDefaultDb(): DatabaseSchema {
  const defaultHash = hashPwd("demo1234");

  const credentialsSet = new Map<string, string>();
  defaultEmployees.forEach((emp) => {
    credentialsSet.set(emp.email.toLowerCase(), defaultHash);
  });
  // Ensure admin
  credentialsSet.set("admin@codevertex.io", defaultHash);

  const adminEmployee: Employee = {
    id: "e2",
    employeeCode: "CVS-000",
    fullName: "Admin Vertex",
    email: "admin@codevertex.io",
    phone: "+92 300 0000000",
    cnic: "42101-0000000-0",
    address: "Main Office, Karachi",
    gender: "male",
    dob: "1985-01-01",
    departmentId: "d3",
    designation: "System Administrator",
    joiningDate: "2020-01-01",
    status: "active",
    salary: 1000000,
    role: "admin",
  };

  const employeesList = [...defaultEmployees];
  const adminIdx = employeesList.findIndex((e) => e.id === "e2");
  if (adminIdx !== -1) {
    employeesList[adminIdx] = adminEmployee;
  } else {
    employeesList.push(adminEmployee);
  }

  const credentials: UserCredentials[] = Array.from(credentialsSet.entries()).map(
    ([email, passwordHash]) => ({ email, passwordHash })
  );

  return {
    employees: employeesList,
    departments: defaultDepartments,
    attendance: defaultAttendance,
    leaveRequests: defaultLeaves,
    projects: defaultProjects,
    tasks: defaultTasks,
    assets: defaultAssets,
    documents: defaultDocuments,
    notifications: defaultNotifications,
    auditLogs: defaultAuditLogs,
    credentials,
  };
}

export function initDb(): void {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(buildDefaultDb()));
  }
}

export function getDb(): DatabaseSchema {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const db = buildDefaultDb();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
  return JSON.parse(raw) as DatabaseSchema;
}

export function saveDb(db: DatabaseSchema): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/** Reset DB to defaults (useful for dev/testing) */
export function resetDb(): void {
  localStorage.setItem(DB_KEY, JSON.stringify(buildDefaultDb()));
}
