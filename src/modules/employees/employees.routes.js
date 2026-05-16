'use strict';
const express = require('express');
const ctrl    = require('./employees.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// All employee routes require authentication
router.use(authenticate);

const hrPlus    = authorize('super-admin', 'admin', 'hr', 'company');
const superOnly = authorize('super-admin');

// Collection routes
router.get ('/',               hrPlus,    ctrl.list);
router.post('/',               hrPlus,    ctrl.create);

// Global list & detail routes
router.get ('/performance',      hrPlus, ctrl.listPerformanceReviews);
router.get ('/performance/:id',  hrPlus, ctrl.getPerformanceReviewById);
router.get ('/certifications',   hrPlus, ctrl.listCertifications);
router.get ('/certifications/:id', hrPlus, ctrl.getCertificationById);

// Bulk operations
router.post('/bulk-delete',    hrPlus,    ctrl.bulkRemove);

// Single employee routes
router.get ('/:id',                       ctrl.getOne);        // Any Auth (self or hr+)
router.put ('/:id',            hrPlus,    ctrl.update);
router.patch('/:id',          hrPlus,    ctrl.update);
router.patch('/:id/status',    hrPlus,    ctrl.patchStatus);
router.delete('/:id',          hrPlus,    ctrl.remove);

// Documents
router.post('/:id/documents',  hrPlus,    ctrl.uploadDocument);
router.get ('/:id/documents',  hrPlus,    ctrl.listDocuments);

// Performance Reviews (By employee)
router.post('/:id/performance', hrPlus, ctrl.addPerformanceReview);
router.get ('/:id/performance', hrPlus, ctrl.listPerformanceReviews);
router.put ('/:id/performance/:reviewId', hrPlus, ctrl.updatePerformanceReview);

// Training & Certifications (By employee)
router.post('/:id/certifications', hrPlus, ctrl.addCertification);
router.get ('/:id/certifications', hrPlus, ctrl.listCertifications);
router.put ('/:id/certifications/:certId', hrPlus, ctrl.updateCertification);

module.exports = router;

