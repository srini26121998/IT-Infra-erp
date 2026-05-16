'use strict';
const express = require('express');
const ctrl = require('./navigation.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/menu', ctrl.getMenu);

module.exports = router;
