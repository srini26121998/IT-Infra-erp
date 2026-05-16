'use strict';
const model = require('./notifications.model');

const listNotifications = (userId, params) => model.listNotifications(userId, params);
const getUnreadCount = (userId) => model.getUnreadCount(userId);
const markRead = (id, userId) => model.markAsRead(id, userId);
const markAllRead = (userId) => model.markAllRead(userId);
const deleteNotif = (id, userId) => model.deleteNotification(id, userId);

module.exports = { listNotifications, getUnreadCount, markRead, markAllRead, deleteNotif };
