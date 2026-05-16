'use strict';
const svc = require('./notifications.service');
const { success } = require('../../utils/response');

const listNotifications = async (req, res, next) => {
  try { return success(res, await svc.listNotifications(req.user.id, req.query)); } catch (e) { next(e); }
};
const getUnreadCount = async (req, res, next) => {
  try { return success(res, await svc.getUnreadCount(req.user.id)); } catch (e) { next(e); }
};
const markRead = async (req, res, next) => {
  try { return success(res, await svc.markRead(req.params.id, req.user.id), 'Marked as read'); } catch (e) { next(e); }
};
const markAllRead = async (req, res, next) => {
  try { await svc.markAllRead(req.user.id); return success(res, null, 'All marked as read'); } catch (e) { next(e); }
};
const deleteNotif = async (req, res, next) => {
  try { await svc.deleteNotif(req.params.id, req.user.id); return success(res, null, 'Notification deleted'); } catch (e) { next(e); }
};

module.exports = { listNotifications, getUnreadCount, markRead, markAllRead, deleteNotif };
