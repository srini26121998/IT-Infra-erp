'use strict';
const { query } = require('../db/pool');

/**
 * Log an administrative action to the partitioned audit table.
 */
const auditLog = async (req, resourceType, action, resourceId, before = {}, after = {}) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || 'System';
    const userRole = req.user?.role || 'System';
    const ip = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    const ua = req.headers['user-agent'];

    await query(`
      INSERT INTO audit_logs (
        id, user_id, user_name, user_role, action, 
        resource_type, resource_id, changes, ip_address, user_agent
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      userId, userName, userRole, action,
      resourceType, resourceId, JSON.stringify({ before, after }), ip, ua
    ]);
  } catch (e) {
    console.error('Audit Log Error:', e.message);
    // Do not throw error to avoid breaking main request flow
  }
};

module.exports = { auditLog };
