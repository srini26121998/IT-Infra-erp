'use strict';

const { success } = require('../../utils/response');

const getMenuItemsByRole = (role) => {
    const commonMain = {
        groupTitle: 'Main',
        items: [
            { title: 'Dashboard', icon: 'dashboard', route: '/dashboard' }
        ]
    };

    const hrmGroup = {
        groupTitle: 'HR & Management',
        items: [
            { title: 'Employees', icon: 'people', route: '/employees', exactMatch: true },
            { title: 'Performance Appraisals', icon: 'stars', route: '/employees/performance' },
            { title: 'Training & Certifications', icon: 'school', route: '/employees/certifications' },
            { title: 'Attendance', icon: 'schedule', route: '/attendance' },
            { title: 'Leave Management', icon: 'event_busy', route: '/leave', exactMatch: true },
            { title: 'Leave Approvals', icon: 'how_to_reg', route: '/leave/approval' },
            { title: 'Payroll', icon: 'payments', route: '/payroll', exactMatch: true },
            { title: 'Departments', icon: 'business', route: '/departments' },
            { title: 'Designations', icon: 'badge', route: '/designations' },
            { title: 'Job Openings', icon: 'work_outline', route: '/jobs' }
        ]
    };

    const payrollServicesGroup = {
        groupTitle: 'Payroll',
        items: [
            { title: 'Salary Structures', icon: 'account_balance_wallet', route: '/payroll/salary-structure' }
        ]
    };

    const projectsGroup = {
        groupTitle: 'Projects',
        items: [
            { title: 'All Projects', icon: 'folder_shared', route: '/projects' }
        ]
    };

    const itInfraGroup = {
        groupTitle: 'IT Assets & Support',
        items: [
            { title: 'Employee Assets', icon: 'person_add', route: '/assets/employee' },
            { title: 'Company Assets', icon: 'business_center', route: '/assets/company' },
            { title: 'Asset Maintenance', icon: 'build', route: '/assets/maintenance' },
            { title: 'Asset Audits', icon: 'plagiarism', route: '/assets/audits' },
            { title: 'Software Subscriptions', icon: 'auto_renew', route: '/subscriptions', exactMatch: true },
            { title: 'Subscription Plans', icon: 'loyalty', route: '/subscriptions/plans' },
            { title: 'Helpdesk Tickets', icon: 'support_agent', route: '/tickets' }
        ]
    };

    const organizationalGroup = {
        groupTitle: 'Organization',
        items: [
            { title: 'Companies', icon: 'business', route: '/companies' },
            { title: 'Branches', icon: 'location_city', route: '/branches' }
        ]
    };

    const financeGroup = {
        groupTitle: 'Finance',
        items: [
            { title: 'Invoices', icon: 'receipt', route: '/invoices' }
        ]
    };

    const contractsGroup = {
        groupTitle: 'Contracts',
        items: [
            { title: 'Contracts', icon: 'assignment', route: '/contracts' }
        ]
    };

    const revenueGroup = {
        groupTitle: 'Revenue',
        items: [
            { title: 'Revenue Dashboard', icon: 'trending_up', route: '/revenue', exactMatch: true },
            { title: 'RA Bills', icon: 'receipt_long', route: '/revenue/ra-bills' }
        ]
    };

    const amcGroup = {
        groupTitle: 'AMC & Services',
        items: [
            { title: 'AMC Contracts', icon: 'handshake', route: '/amc' },
            { title: 'Timesheets', icon: 'history_toggle_off', route: '/payroll/timesheet' }
        ]
    };

    const adminGroup = {
        groupTitle: 'Administration',
        items: [
            { title: 'Roles & Permissions', icon: 'security', route: '/roles' },
            { title: 'Workflows', icon: 'account_tree', route: '/workflow' },
            { title: 'Escalation Rules', icon: 'warning', route: '/escalations' },
            { title: 'System Reports', icon: 'description', route: '/reports' },
            { title: 'Audit Logs', icon: 'history', route: '/audit-logs' }
        ]
    };

    const companyGroup = {
        groupTitle: 'Client Portal',
        items: [
            { title: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
            { title: 'Create Request', icon: 'add_circle', route: '/workflow/company/create' },
            { title: 'My Requests', icon: 'list_alt', route: '/workflow/company/requests' },
            { title: 'Notifications', icon: 'notifications', route: '/workflow/company/notifications' },
            { title: 'Support Profile', icon: 'contact_support', route: '/workflow/company/profile' }
        ]
    };

    const helpdeskGroup = {
        groupTitle: 'Helpdesk Support',
        items: [
            { title: 'Support Dashboard', icon: 'dashboard', route: '/dashboard' },
            { title: 'Incoming Tickets', icon: 'move_to_inbox', route: '/workflow/helpdesk/incoming' },
            { title: 'Task Allocation', icon: 'assignment_ind', route: '/workflow/helpdesk/assign' },
            { title: 'Team Directory', icon: 'people', route: '/workflow/helpdesk/employees' },
            { title: 'SLA Tracking', icon: 'timer', route: '/workflow/helpdesk/sla' },
            { title: 'Escalations', icon: 'warning', route: '/escalations' },
            { title: 'Performance Reports', icon: 'bar_chart', route: '/workflow/helpdesk/reports' },
            { title: 'Notifications', icon: 'notifications', route: '/workflow/helpdesk/notifications' }
        ]
    };

    const workflowEmployeeGroup = {
        groupTitle: 'Employee Workspace',
        items: [
            { title: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
            { title: 'My Tasks', icon: 'task', route: '/workflow/employee/tasks' },
            { title: 'Task Details', icon: 'info', route: '/workflow/employee/details' },
            { title: 'Support Center', icon: 'support_agent', route: '/tickets' },
            { title: 'Asset List', icon: 'person_add', route: '/assets/employee' },
            { title: 'Notifications', icon: 'notifications', route: '/workflow/employee/notifications' }
        ]
    };

    const workflowManagerGroup = {
        groupTitle: 'Management Portal',
        items: [
            { title: 'Manager Dashboard', icon: 'dashboard', route: '/dashboard' },
            { title: 'Approvals', icon: 'pending_actions', route: '/workflow/manager/pending' },
            { title: 'Leave Requests', icon: 'how_to_reg', route: '/leave/approval' },
            { title: 'Approval History', icon: 'history', route: '/workflow/manager/history' },
            { title: 'Team Analytics', icon: 'analytics', route: '/workflow/manager/reports' },
            { title: 'Support Center', icon: 'support_agent', route: '/tickets' },
            { title: 'Notifications', icon: 'notifications', route: '/workflow/manager/notifications' }
        ]
    };

    const setupGroup = {
        groupTitle: 'Setup',
        items: [
            { title: 'System Settings', icon: 'settings', route: '/settings' }
        ]
    };

    const analyticsReportsGroup = {
        groupTitle: 'Reports',
        items: [
            { title: 'All Reports', icon: 'analytics', route: '/reports' }
        ]
    };

    switch (role) {
        case 'super-admin':
            return [commonMain, setupGroup, hrmGroup, financeGroup, analyticsReportsGroup, payrollServicesGroup, projectsGroup, itInfraGroup, contractsGroup, revenueGroup, amcGroup, organizationalGroup, adminGroup];

        case 'admin':
            return [commonMain, hrmGroup, payrollServicesGroup, projectsGroup, itInfraGroup, organizationalGroup, financeGroup, {
                groupTitle: 'Admin',
                items: [
                    { title: 'Reports', icon: 'description', route: '/reports' },
                    { title: 'Audit Logs', icon: 'history', route: '/audit-logs' }
                ]
            }];

        case 'hr':
            return [commonMain, hrmGroup, payrollServicesGroup, projectsGroup, organizationalGroup];

        case 'manager':
            return [workflowManagerGroup];

        case 'employee':
            return [workflowEmployeeGroup];

        case 'company':
            return [companyGroup];

        case 'helpdesk':
            return [helpdeskGroup];

        default:
            return [commonMain];
    }
};

const getMenu = async (req, res, next) => {
    try {
        const role = req.user.role || 'employee';
        const menu = getMenuItemsByRole(role);
        return success(res, menu, 'Menu items retrieved successfully');
    } catch (e) {
        next(e);
    }
};

module.exports = {
    getMenu
};
