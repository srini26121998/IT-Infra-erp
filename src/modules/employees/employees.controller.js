'use strict';
const svc = require('./employees.service');
const { success, paginated } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const { status, departmentId, search, page = 1, limit = 20 } = req.query;
    const { rows, total } = await svc.listEmployees({ status, departmentId, search, page, limit });
    return paginated(res, rows, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { next(e); }
};

const getOne = async (req, res, next) => {
  try { return success(res, await svc.getEmployee(req.params.id)); }
  catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try { return success(res, await svc.createEmployee(req.body), 'Employee created', 201); }
  catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try { return success(res, await svc.updateEmployee(req.params.id, req.body), 'Employee updated'); }
  catch (e) { next(e); }
};

const patchStatus = async (req, res, next) => {
  try { return success(res, await svc.patchStatus(req.params.id, req.body.status), 'Status updated'); }
  catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try { await svc.deleteEmployee(req.params.id); return success(res, null, 'Employee deleted'); }
  catch (e) { next(e); }
};

const uploadDocument = async (req, res, next) => {
  try { return success(res, await svc.uploadDocument(req.params.id, req.body), 'Document uploaded', 201); }
  catch (e) { next(e); }
};

const listDocuments = async (req, res, next) => {
  try { return success(res, await svc.listDocuments(req.params.id), 'Documents'); }
  catch (e) { next(e); }
};

const bulkRemove = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const count = await svc.bulkDelete(ids);
    return success(res, { deletedCount: count }, `${count} employee(s) deleted`);
  } catch (e) { next(e); }
};

const addPerformanceReview = async (req, res, next) => {
  try { return success(res, await svc.addPerformanceReview(req.params.id, req.body), 'Performance review added', 201); }
  catch (e) { next(e); }
};

const listPerformanceReviews = async (req, res, next) => {
  try { return success(res, await svc.listPerformanceReviews(req.params.id || null), 'Performance reviews'); }
  catch (e) { next(e); }
};

const getPerformanceReviewById = async (req, res, next) => {
  try { return success(res, await svc.getPerformanceReviewById(req.params.id), 'Performance review'); }
  catch (e) { next(e); }
};

const updatePerformanceReview = async (req, res, next) => {
  try { return success(res, await svc.updatePerformanceReview(req.params.reviewId || req.params.id, req.body), 'Performance review updated'); }
  catch (e) { next(e); }
};

const addCertification = async (req, res, next) => {
  try { return success(res, await svc.addCertification(req.params.id, req.body), 'Certification added', 201); }
  catch (e) { next(e); }
};

const listCertifications = async (req, res, next) => {
  try { return success(res, await svc.listCertifications(req.params.id || null), 'Certifications'); }
  catch (e) { next(e); }
};

const getCertificationById = async (req, res, next) => {
  try { return success(res, await svc.getCertificationById(req.params.id), 'Certification'); }
  catch (e) { next(e); }
};

const updateCertification = async (req, res, next) => {
  try { return success(res, await svc.updateCertification(req.params.certId || req.params.id, req.body), 'Certification updated'); }
  catch (e) { next(e); }
};

module.exports = { 
  list, getOne, create, update, patchStatus, remove, bulkRemove, uploadDocument, listDocuments,
  addPerformanceReview, listPerformanceReviews, updatePerformanceReview, getPerformanceReviewById,
  addCertification, listCertifications, updateCertification, getCertificationById
};
