'use strict';

const trackingModel = require('./tracking.model');

async function getLiveTracking(req, res, next) {
  try {
    const data = await trackingModel.getLiveTrackingData();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLiveTracking
};
