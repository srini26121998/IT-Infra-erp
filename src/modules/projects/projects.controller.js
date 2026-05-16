'use strict';
const svc = require('./projects.service');
const { success, paginated } = require('../../utils/response');

const listProjects = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const { rows, total } = await svc.listProjects({ status, page, limit });
    return paginated(res, rows, { total, page: +(page || 1), limit: +(limit || 20) });
  } catch (e) { next(e); }
};

const getProject = async (req, res, next) => {
  try {
    const project = await svc.getProject(req.params.id);
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
    const team = await svc.listTeam(req.params.id);
    return success(res, { ...project, team });
  } catch (e) { next(e); }
};

const createProject = async (req, res, next) => {
  try { return success(res, await svc.createProject(req.body), 'Project created', 201); } catch (e) { next(e); }
};

const updateProject = async (req, res, next) => {
  try { return success(res, await svc.updateProject(req.params.id, req.body), 'Project updated'); } catch (e) { next(e); }
};

const deleteProject = async (req, res, next) => {
  try { await svc.deleteProject(req.params.id); return success(res, null, 'Project deleted'); } catch (e) { next(e); }
};

const addTeamMember = async (req, res, next) => {
  try {
    const { employeeId, role } = req.body;
    return success(res, await svc.addTeamMember(req.params.id, employeeId, role), 'Team member added');
  } catch (e) { next(e); }
};

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject, addTeamMember };
