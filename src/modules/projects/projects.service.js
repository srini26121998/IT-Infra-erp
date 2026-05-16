'use strict';
const model = require('./projects.model');

const listProjects = ({ status, page = 1, limit = 20 }) => model.listProjects({ status, page: +page, limit: +limit });
const getProject = (id) => model.findById(id);
const createProject = (data) => model.createProject(data);
const updateProject = (id, data) => model.updateProject(id, data);
const deleteProject = (id) => model.softDelete(id);
const addTeamMember = (projectId, employeeId, role) => model.addTeamMember(projectId, employeeId, role);
const listTeam = (projectId) => model.listTeam(projectId);

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject, addTeamMember, listTeam };
