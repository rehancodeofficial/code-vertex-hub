/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EmployeesAPI,
  DepartmentsAPI,
  AttendanceAPI,
  LeavesAPI,
  DocumentsAPI,
  AssetsAPI,
  ProjectsAPI,
  TasksAPI,
  AuditLogsAPI,
  NotificationsAPI,
  ReportsAPI,
  SettingsAPI,
} from "../../services/api";

// ------------------------------------
// Employee functions
// ------------------------------------
export async function getEmployeesFn() {
  return (await EmployeesAPI.getAll()) as any;
}

export async function getEmployeeByIdFn({ data }: { data: { id: string } }) {
  return (await EmployeesAPI.getById(data.id)) as any;
}

export async function createEmployeeFn({ data }: { data: any }) {
  return (await EmployeesAPI.create(data)) as any;
}

export async function updateEmployeeFn({ data }: { data: { id: string; updates: any } }) {
  return (await EmployeesAPI.update(data.id, data.updates)) as any;
}

export async function deleteEmployeeFn({ data }: { data: { id: string } }) {
  return (await EmployeesAPI.delete(data.id)) as any;
}

// ------------------------------------
// Departments
// ------------------------------------
export async function getDepartmentsFn() {
  return (await DepartmentsAPI.getAll()) as any;
}

export async function createDepartmentFn({ data }: { data: any }) {
  return (await DepartmentsAPI.create(data)) as any;
}

export async function updateDepartmentFn({ data }: { data: { id: string; updates: any } }) {
  return (await DepartmentsAPI.update(data.id, data.updates)) as any;
}

export async function deleteDepartmentFn({ data }: { data: { id: string } }) {
  return (await DepartmentsAPI.delete(data.id)) as any;
}

// ------------------------------------
// Attendance functions
// ------------------------------------
export async function getAttendanceFn() {
  return (await AttendanceAPI.getAll()) as any;
}

export async function checkInFn() {
  return (await AttendanceAPI.checkIn()) as any;
}

export async function checkOutFn() {
  return (await AttendanceAPI.checkOut()) as any;
}

// ------------------------------------
// Leave functions
// ------------------------------------
export async function getLeavesFn() {
  return (await LeavesAPI.getAll()) as any;
}

export async function applyLeaveFn({ data }: { data: any }) {
  return (await LeavesAPI.apply(data)) as any;
}

export async function updateLeaveStatusFn({
  data,
}: {
  data: { id: string; status: "approved" | "rejected"; reason?: string };
}) {
  return (await LeavesAPI.updateStatus(data.id, {
    status: data.status,
    reason: data.reason,
  })) as any;
}

// ------------------------------------
// Document functions
// ------------------------------------
export async function getDocumentsFn() {
  return (await DocumentsAPI.getAll()) as any;
}

export async function uploadDocumentFn({ data }: { data: any }) {
  const formData = new FormData();
  if (data.file) formData.append("file", data.file);
  formData.append("name", data.name);
  formData.append("type", data.type);
  formData.append("employeeId", data.employeeId);
  return (await DocumentsAPI.upload(formData)) as any;
}

export async function deleteDocumentFn({ data }: { data: { id: string } }) {
  return (await DocumentsAPI.delete(data.id)) as any;
}

// ------------------------------------
// Assets
// ------------------------------------
export async function getAssetsFn() {
  return (await AssetsAPI.getAll()) as any;
}

export async function createAssetFn({ data }: { data: any }) {
  return (await AssetsAPI.create(data)) as any;
}

export async function updateAssetFn({ data }: { data: { id: string; updates: any } }) {
  return (await AssetsAPI.update(data.id, data.updates)) as any;
}

// ------------------------------------
// Projects & Tasks
// ------------------------------------
export async function getProjectsFn() {
  return (await ProjectsAPI.getAll()) as any;
}

export async function getTasksFn() {
  return (await TasksAPI.getAll()) as any;
}

// ------------------------------------
// Audit logs & Notifications
// ------------------------------------
export async function getAuditLogsFn() {
  return (await AuditLogsAPI.getAll()) as any;
}

export async function getNotificationsFn() {
  return (await NotificationsAPI.getAll()) as any;
}

export async function markNotificationReadFn({ data }: { data: { id: string } }) {
  return (await NotificationsAPI.markRead(data.id)) as any;
}

export async function markAllNotificationsReadFn() {
  return (await NotificationsAPI.markAllRead()) as any;
}

// ------------------------------------
// Reports / Dashboard
// ------------------------------------
export async function getDashboardStatsFn() {
  return (await ReportsAPI.getDashboardStats()) as any;
}

// ------------------------------------
// Settings
// ------------------------------------
export async function getSettingsFn() {
  return (await SettingsAPI.get()) as any;
}

export async function updateSettingsFn({ data }: { data: Record<string, unknown> }) {
  return (await SettingsAPI.update(data)) as any;
}
