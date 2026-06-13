-- Supabase/PostgreSQL: Employee Performance and Status Report
-- Purpose:
--   Active employees ki department details, pending tasks, current-month attendance,
--   aur current-year leave balance ek report me show karta hai.
--
-- Note:
--   Prisma schema me kuch columns camelCase hain, is liye unko double quotes me
--   likhna zaroori hai: "employeeCode", "fullName", "departmentId", etc.

WITH params AS (
    SELECT
        date_trunc('month', CURRENT_DATE)::timestamp AS month_start,
        (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::timestamp AS next_month_start,
        EXTRACT(YEAR FROM CURRENT_DATE)::int AS current_year
),
task_stats AS (
    SELECT
        t."assigneeId",
        COUNT(*) FILTER (WHERE t.status IN ('todo', 'in_progress')) AS pending_tasks,
        COUNT(*) FILTER (WHERE t.status = 'review') AS review_tasks,
        COUNT(*) FILTER (WHERE t.status = 'done') AS completed_tasks
    FROM tasks t
    GROUP BY t."assigneeId"
),
attendance_stats AS (
    SELECT
        ar."employeeId",
        COUNT(*) FILTER (WHERE ar.status = 'present') AS days_present,
        COUNT(*) FILTER (WHERE ar.status = 'late') AS days_late,
        COUNT(*) FILTER (WHERE ar.status = 'absent') AS days_absent,
        COUNT(*) FILTER (WHERE ar.status = 'leave') AS days_on_leave,
        COUNT(*) FILTER (WHERE ar.status = 'half_day') AS half_days,
        COALESCE(SUM(ar.hours), 0)::numeric(10, 2) AS total_hours
    FROM attendance_records ar
    CROSS JOIN params p
    WHERE ar.date >= p.month_start
      AND ar.date < p.next_month_start
    GROUP BY ar."employeeId"
),
leave_stats AS (
    SELECT
        lb."employeeId",
        COALESCE(SUM(lb.entitlement), 0)::int AS total_leave_entitlement,
        COALESCE(SUM(lb.used), 0)::int AS total_leave_used,
        COALESCE(SUM(lb.pending), 0)::int AS total_leave_pending,
        COALESCE(SUM(lb."carriedOver"), 0)::int AS total_leave_carried_over,
        COALESCE(SUM(lb.entitlement + lb."carriedOver" - lb.used - lb.pending), 0)::int AS available_leave_balance
    FROM leave_balances lb
    CROSS JOIN params p
    WHERE lb.year = p.current_year
    GROUP BY lb."employeeId"
)
SELECT
    e.id AS employee_id,
    e."employeeCode" AS employee_code,
    e."fullName" AS full_name,
    e.email,
    e.phone,
    e.designation,
    e.role,
    e.status,
    d.id AS department_id,
    d.name AS department_name,
    d.code AS department_code,

    COALESCE(ts.pending_tasks, 0) AS pending_tasks,
    COALESCE(ts.review_tasks, 0) AS review_tasks,
    COALESCE(ts.completed_tasks, 0) AS completed_tasks,

    COALESCE(att.days_present, 0) AS days_present_this_month,
    COALESCE(att.days_late, 0) AS days_late_this_month,
    COALESCE(att.days_absent, 0) AS days_absent_this_month,
    COALESCE(att.days_on_leave, 0) AS days_on_leave_this_month,
    COALESCE(att.half_days, 0) AS half_days_this_month,
    COALESCE(att.total_hours, 0)::numeric(10, 2) AS total_hours_this_month,

    COALESCE(ls.total_leave_entitlement, 0) AS total_leave_entitlement_this_year,
    COALESCE(ls.total_leave_used, 0) AS total_leave_used_this_year,
    COALESCE(ls.total_leave_pending, 0) AS total_leave_pending_this_year,
    COALESCE(ls.total_leave_carried_over, 0) AS total_leave_carried_over_this_year,
    COALESCE(ls.available_leave_balance, 0) AS available_leave_balance_this_year
FROM employees e
LEFT JOIN departments d ON d.id = e."departmentId"
LEFT JOIN task_stats ts ON ts."assigneeId" = e.id
LEFT JOIN attendance_stats att ON att."employeeId" = e.id
LEFT JOIN leave_stats ls ON ls."employeeId" = e.id
WHERE e.status = 'active'
ORDER BY d.name NULLS LAST, e."fullName" ASC;
