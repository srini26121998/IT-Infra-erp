'use strict';
const model = require('./employees.model');

const listEmployees = async ({ status, departmentId, search, page = 1, limit = 20 }) => {
  return model.listEmployees({ status, departmentId, search, page: Number(page), limit: Number(limit) });
};

const getEmployee = async (id) => {
  const emp = await model.findById(id);
  if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });
  return emp;
};

const createEmployee = async (data) => {
  // Use client-provided employeeId if given; otherwise auto-generate one
  const employeeId = data.employeeId || (await model.nextEmployeeId());
  try {
    return await model.createEmployee({ ...data, employeeId });
  } catch (err) {
    // Postgres unique-violation code = 23505
    if (err.code === '23505') {
      if (err.constraint && err.constraint.includes('email')) {
        throw Object.assign(new Error(`Email '${data.email}' is already registered`), { status: 409 });
      }
      if (err.constraint && err.constraint.includes('employee_id')) {
        throw Object.assign(new Error(`Employee ID '${employeeId}' already exists`), { status: 409 });
      }
      throw Object.assign(new Error('A unique constraint was violated — please check email or employee ID'), { status: 409 });
    }
    throw err;
  }
};

const updateEmployee = async (id, data) => {
  try {
    const emp = await model.updateEmployee(id, data);
    if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });
    return emp;
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint && err.constraint.includes('email')) {
        throw Object.assign(new Error(`Email '${data.email}' is already in use`), { status: 409 });
      }
      throw Object.assign(new Error('A unique constraint was violated'), { status: 409 });
    }
    throw err;
  }
};

const patchStatus = async (id, status) => {
  const valid = ['Active', 'Inactive', 'On Leave'];
  if (!valid.includes(status)) throw Object.assign(new Error(`Status must be one of: ${valid.join(', ')}`), { status: 400 });
  const emp = await model.patchStatus(id, status);
  if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });
  return emp;
};

const deleteEmployee = async (id) => model.softDelete(id);

const bulkDelete = async (ids) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw Object.assign(new Error('At least one ID is required'), { status: 400 });
  }
  return model.bulkSoftDelete(ids);
};

const uploadDocument = async (employeeId, { docType, fileName, fileUrl, fileSize }) => {
  const emp = await model.findById(employeeId);
  if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });
  return model.addDocument({ employeeId, docType, fileName, fileUrl, fileSize });
};

const listDocuments = async (employeeId) => {
  const emp = await model.findById(employeeId);
  if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });
  return model.listDocuments(employeeId);
};

const addPerformanceReview = async (employeeId, data) => {
  const emp = await model.findById(employeeId);
  if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });
  return model.addPerformanceReview({ ...data, employeeId });
};

const listPerformanceReviews = async (employeeId) => {
  if (employeeId) {
    const emp = await model.findById(employeeId);
    if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });
    return model.listPerformanceReviews(employeeId);
  } else {
    return model.listAllPerformanceReviews();
  }
};

const updatePerformanceReview = async (reviewId, data) => {
  const review = await model.updatePerformanceReview(reviewId, data);
  if (!review) throw Object.assign(new Error('Review not found'), { status: 404 });
  return review;
};

const getPerformanceReviewById = async (reviewId) => {
  const review = await model.findPerformanceReviewById(reviewId);
  if (!review) throw Object.assign(new Error('Review not found'), { status: 404 });
  return review;
};

const addCertification = async (employeeId, data) => {
  const emp = await model.findById(employeeId);
  if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });
  return model.addCertification({ ...data, employeeId });
};

const listCertifications = async (employeeId) => {
  if (employeeId) {
    const emp = await model.findById(employeeId);
    if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });
    return model.listCertifications(employeeId);
  } else {
    return model.listAllCertifications();
  }
};

const updateCertification = async (certId, data) => {
  const cert = await model.updateCertification(certId, data);
  if (!cert) throw Object.assign(new Error('Certification not found'), { status: 404 });
  return cert;
};

const getCertificationById = async (certId) => {
  const cert = await model.findCertificationById(certId);
  if (!cert) throw Object.assign(new Error('Certification not found'), { status: 404 });
  return cert;
};

module.exports = {
  listEmployees, getEmployee, createEmployee, updateEmployee,
  patchStatus, deleteEmployee, bulkDelete, uploadDocument, listDocuments,
  addPerformanceReview, listPerformanceReviews, updatePerformanceReview, getPerformanceReviewById,
  addCertification, listCertifications, updateCertification, getCertificationById
};
