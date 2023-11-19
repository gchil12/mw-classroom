const { check, validationResult } = require('express-validator');
const { pool } = require('./db'); // Import the database connection pool from a separate module

const validateTeacherRegistration = [
  check('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

const validatePasswordStrength = (password) => {
  return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/.test(password);
};

module.exports = { validateTeacherRegistration, validatePasswordStrength };
