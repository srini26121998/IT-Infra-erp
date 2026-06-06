'use strict';
const { query } = require('../../db/pool');

const listNotifications = async (userId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { rows } = await query(`
    SELECT * FROM notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC LIMIT $2 OFFSET $3;
  `, [userId, limit, offset]);
  return rows;
};

const getUnreadCount = async (userId) => {
  const { rows } = await query('SELECT COUNT(*) AS unread FROM notifications WHERE user_id = $1 AND is_read = FALSE', [userId]);
  return parseInt(rows[0].unread, 10);
};

const markAsRead = async (id, userId) => {
  const { rows } = await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
  return rows[0];
};

const markAllRead = async (userId) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
  return true;
};

const deleteNotification = async (id, userId) => {
  const { rowCount } = await query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
  return rowCount > 0;
};

const fanOutEscalation = async (title, message) => {
  await query(`
    INSERT INTO notifications (user_id, type, title, message)
    SELECT id, 'escalation', $1, $2
    FROM users WHERE role IN ('admin', 'super-admin') AND is_active = TRUE;
  `, [title, message]);
};

const createNotification = async (userId, type, title, message) => {
  const { rows } = await query(`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `, [userId, type, title, message]);
  return rows[0];
};

const notifyRoles = async (roles, type, title, message) => {
  await query(`
    INSERT INTO notifications (user_id, type, title, message)
    SELECT id, $1, $2, $3
    FROM users WHERE role = ANY($4::text[]) AND is_active = TRUE;
  `, [type, title, message, roles]);
};

module.exports = { listNotifications, getUnreadCount, markAsRead, markAllRead, deleteNotification, fanOutEscalation, createNotification, notifyRoles };
