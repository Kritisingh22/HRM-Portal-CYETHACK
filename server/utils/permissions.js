/* Role-Based Access Control (RBAC): the single source of truth for what each
 * role may do. Permissions are "<resource>:<action>" strings. A "*" wildcard
 * grants everything; "<resource>:*" grants all actions on that resource.
 *
 * Enforced on the SERVER (middleware/authorize.js + per-resource ownership
 * checks in controllers). Reads are usually gated by authenticate + row-level
 * scoping in the controller; writes/admin actions are gated by these permissions.
 * The role always comes from the verified JWT / database, never from the client.
 */
const ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];

const PERMISSIONS = {
  SUPER_ADMIN: ['*'],

  ADMIN: [
    'users:manage',
    'employees:*', 'leaves:*', 'attendance:*', 'payroll:*', 'hiring:*',
    'performance:*', 'projects:*', 'documents:*', 'notices:*', 'helpdesk:*',
    'offboarding:*', 'reports:read', 'analytics:read', 'audit:read'
  ],

  HR: [
    'employees:read', 'employees:write', 'employees:delete',
    'leaves:read', 'leaves:write', 'leaves:approve',
    'attendance:read', 'attendance:write',
    'payroll:read', 'payroll:write',
    'hiring:read', 'hiring:write', 'hiring:delete',
    'performance:read', 'performance:write',
    'projects:read', 'projects:write',
    'documents:read', 'documents:write', 'documents:delete',
    'notices:read', 'notices:write', 'notices:delete',
    'helpdesk:read', 'helpdesk:write', 'helpdesk:manage',
    'offboarding:read', 'offboarding:write',
    'users:read',
    'reports:read', 'analytics:read', 'audit:read'
  ],

  MANAGER: [
    'employees:read',
    'leaves:read', 'leaves:approve',
    'attendance:read',
    'performance:read', 'performance:write',   // for their team (scoped in controller)
    'projects:read', 'projects:write',
    'documents:read',
    'notices:read',
    'helpdesk:read', 'helpdesk:write', 'helpdesk:manage',
    'reports:read', 'analytics:read',
    // own self-service
    'leaves:read_own', 'leaves:write_own', 'attendance:read_own', 'payroll:read_own',
    'employees:read_own', 'performance:read_own', 'projects:read_own', 'documents:read_own',
    'documents:write_own', 'helpdesk:write_own'
  ],

  EMPLOYEE: [
    'employees:read_own',
    'leaves:read_own', 'leaves:write_own',
    'attendance:read_own',
    'payroll:read_own',
    'performance:read_own',
    'projects:read_own',
    'documents:read_own', 'documents:write_own',
    'notices:read',
    'helpdesk:read_own', 'helpdesk:write_own'
  ]
};

function permissionsFor(role) { return PERMISSIONS[role] || []; }

function hasPermission(role, permission) {
  const perms = permissionsFor(role);
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;
  const resource = permission.split(':')[0];
  if (perms.includes(resource + ':*')) return true;
  return false;
}

module.exports = { ROLES, PERMISSIONS, permissionsFor, hasPermission };
