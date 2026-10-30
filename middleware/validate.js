const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Run validation and return errors
exports.validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (let validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
    });
  };
};

// Sanitize request body - remove dangerous fields
exports.sanitize = (req, res, next) => {
  const dangerousFields = ['__proto__', 'constructor', 'prototype'];
  dangerousFields.forEach((field) => {
    delete req.body[field];
    delete req.query[field];
    delete req.params[field];
  });
  next();
};
