'use strict';
const express = require('express');
const ctrl = require('./projects.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

const adminHrMgr = authorize('admin', 'hr', 'manager', 'super-admin');
const superOnly = authorize('super-admin');

router.get('/', adminHrMgr, ctrl.listProjects);
router.post('/', adminHrMgr, ctrl.createProject);
router.get('/:id', adminHrMgr, ctrl.getProject);
router.put('/:id', adminHrMgr, ctrl.updateProject);
router.delete('/:id', superOnly, ctrl.deleteProject);
router.post('/:id/team', adminHrMgr, ctrl.addTeamMember);

module.exports = router;
