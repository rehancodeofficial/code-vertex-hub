export type EmploymentStatus = "active" | "on_leave" | "probation" | "terminated" | "pending";
export type Role = "admin" | "employee" | "manager" | "supervisor" | "accountant";

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string | null;
  headcount: number;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  cnic: string;
  address: string;
  gender: "male" | "female" | "other";
  dob: string;
  departmentId: string;
  designation: string;
  joiningDate: string;
  status: EmploymentStatus;
  salary: number;
  avatar?: string;
  role: Role;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "absent" | "leave" | "late" | "half_day";
  hours: number;
}

export type LeaveType = "annual" | "sick" | "casual" | "emergency";
export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  deadline: string;
  budget: number;
  memberIds: string[];
}

export type TaskPriority = "low" | "medium" | "high" | "critical";
export interface Task {
  id: string;
  title: string;
  projectId: string;
  assigneeId: string;
  priority: TaskPriority;
  status: "todo" | "in_progress" | "review" | "done";
  deadline: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  tag: string;
  name: string;
  category: "laptop" | "monitor" | "keyboard" | "mouse" | "headset" | "furniture" | "other";
  serial: string;
  status: "available" | "assigned" | "maintenance" | "retired";
  assignedTo: string | null;
  purchaseDate: string;
  value: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: "contract" | "certificate" | "id" | "offer_letter" | "other";
  employeeId: string;
  uploadedAt: string;
  sizeKb: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: "leave" | "task" | "attendance" | "project" | "system";
  unread: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}
