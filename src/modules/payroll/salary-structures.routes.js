'use strict';

const express  = require('express');
const ctrl     = require('./payroll.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminHr = authorize('admin', 'hr', 'super-admin');

router.get ('/', adminHr, ctrl.listStructures);
router.post('/', adminHr, ctrl.createStructure);

module.exports = router;
