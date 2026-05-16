'use strict';
const model = require('./subscriptions.model');

const listSubscriptions = (filters) => model.list(filters);
const getSubscription = (id) => model.findById(id);
const createSubscription = (data) => model.create(data);
const updateSubscription = (id, data) => model.update(id, data);
const renewSubscription = (id) => model.renew(id);
const deleteSubscription = (id) => model.softDelete(id);

const listPlans = () => model.listPlans();

const handleWebhook = async (payload) => {
  const { order_id, transaction_id, status, amount, subscription_id } = payload;
  
  // Idempotency check
  const exists = await model.findTransactionByOrderId(order_id);
  if (exists) return { success: true, message: 'Already processed' };

  return model.createTransaction({
    subscriptionId: subscription_id,
    transactionId: transaction_id,
    orderId: order_id,
    amount: amount,
    status: status,
    gatewayResponse: payload
  });
};

const sendExpiryReminder = async (id) => {
  const sub = await model.findById(id);
  if (!sub) throw Object.assign(new Error('Subscription not found'), { status: 404 });
  // In a real app, integrate with email util here
  return { success: true, message: `Reminder sent to ${sub.customer_email}` };
};

module.exports = {
  listSubscriptions, getSubscription, createSubscription, updateSubscription, renewSubscription, deleteSubscription,
  listPlans, handleWebhook, sendExpiryReminder
};
