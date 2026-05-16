'use strict';
const svc = require('./subscriptions.service');
const { success } = require('../../utils/response');

const listSubscriptions = async (req, res, next) => {
  try { return success(res, await svc.listSubscriptions(req.query)); } catch (e) { next(e); }
};
const getSubscription = async (req, res, next) => {
  try {
    const sub = await svc.getSubscription(req.params.id);
    if (!sub) throw Object.assign(new Error('Not found'), { status: 404 });
    return success(res, sub);
  } catch (e) { next(e); }
};
const createSubscription = async (req, res, next) => {
  try { return success(res, await svc.createSubscription(req.body), 'Created', 201); } catch (e) { next(e); }
};
const updateSubscription = async (req, res, next) => {
  try { return success(res, await svc.updateSubscription(req.params.id, req.body), 'Updated'); } catch (e) { next(e); }
};
const deleteSubscription = async (req, res, next) => {
  try { await svc.deleteSubscription(req.params.id); return success(res, null, 'Deleted'); } catch (e) { next(e); }
};
const renewSubscription = async (req, res, next) => {
  try { return success(res, await svc.renewSubscription(req.params.id), 'Renewed'); } catch (e) { next(e); }
};
const sendReminder = async (req, res, next) => {
  try { return success(res, await svc.sendExpiryReminder(req.params.id)); } catch (e) { next(e); }
};
const listPlans = async (req, res, next) => {
  try { return success(res, await svc.listPlans()); } catch (e) { next(e); }
};
const initiatePayment = async (req, res, next) => {
  try { return success(res, { checkoutUrl: 'https://gateway.example.com/pay' }); } catch (e) { next(e); }
};
const paymentWebhook = async (req, res, next) => {
  try { await svc.handleWebhook(req.body); return success(res, { received: true }); } catch (e) { next(e); }
};

module.exports = {
  listSubscriptions, getSubscription, createSubscription, updateSubscription, deleteSubscription,
  renewSubscription, sendReminder, listPlans, initiatePayment, paymentWebhook
};
