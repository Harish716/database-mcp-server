const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/teacher/login', authController.teacherLogin);
router.post('/student/login', authController.studentLogin);

module.exports = router;
