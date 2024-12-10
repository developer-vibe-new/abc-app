const Joi = require('joi');

exports.registerOperator = Joi.object({
    fullName: Joi.string().required().messages({
        'string.base': 'Full name must be a string',
        'any.required': 'Full name is required'
    }),
    phone: Joi.number().integer().min(1000000000).max(9999999999).required().messages({
        'number.base': 'Phone number must be a number',
        'number.integer': 'Phone number must be an integer',
        'number.min': 'Phone number must be exactly 10 digits',
        'number.max': 'Phone number must be exactly 10 digits',
        'any.required': 'Phone number is required'
    }),
    city: Joi.string().required().messages({
        'string.base': 'City must be a string',
        'any.required': 'City is required'
    })
});

exports.loginOperator = Joi.object({
    phone: Joi.number().integer().min(1000000000).max(9999999999).required().messages({
        'number.base': 'Phone number must be a number',
        'number.integer': 'Phone number must be an integer',
        'number.min': 'Phone number must be exactly 10 digits',
        'number.max': 'Phone number must be exactly 10 digits',
        'any.required': 'Phone number is required'
    })
});

exports.verifyOtpOperator = Joi.object({
    phone: Joi.number().integer().min(1000000000).max(9999999999).required().messages({
        'number.base': 'Phone number must be a number',
        'number.integer': 'Phone number must be an integer',
        'number.min': 'Phone number must be exactly 10 digits',
        'number.max': 'Phone number must be exactly 10 digits',
        'any.required': 'Phone number is required'
    }),
    otp: Joi.number().integer().min(100000).max(999999).required().messages({
        'number.base': 'OTP must be a number',
        'number.integer': 'OTP must be an integer',
        'number.min': 'OTP must be exactly 6 digits',
        'number.max': 'OTP must be exactly 6 digits',
        'any.required': 'OTP is required'
    })
});


// Define the validation schema
exports.validateDocumentsOperator = Joi.object({
    pancardName: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[a-zA-Z\s]*$/) // Only alphabets and spaces
        .required()
        .messages({
            'string.empty': 'Pancard name is required',
            'string.pattern.base': 'Pancard name should only contain alphabets and spaces',
            'string.min': 'Pancard name must be at least 3 characters',
            'string.max': 'Pancard name cannot exceed 50 characters',
        }),
    pancardNumber: Joi.string()
        .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/) // PAN card format (e.g., ABCDE1234F)
        .required()
        .messages({
            'string.empty': 'Pancard number is required',
            'string.pattern.base': 'Invalid pancard number format',
        }),
    aadharcardName: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[a-zA-Z\s]*$/)
        .required()
        .messages({
            'string.empty': 'Aadharcard name is required',
            'string.pattern.base': 'Aadharcard name should only contain alphabets and spaces',
            'string.min': 'Aadharcard name must be at least 3 characters',
            'string.max': 'Aadharcard name cannot exceed 50 characters',
        }),
    aadharcardNumber: Joi.string()
        .length(12) // Aadhaar is 12 digits long
        .pattern(/^\d+$/) // Only digits allowed
        .required()
        .messages({
            'string.empty': 'Aadharcard number is required',
            'string.pattern.base': 'Aadharcard number must be numeric',
            'string.length': 'Aadharcard number must be exactly 12 digits',
        }),
    bankAccountNumber: Joi.string()
        .min(9)
        .max(18) // Typical bank account numbers range between 9-18 digits
        .pattern(/^\d+$/) // Only digits allowed
        .required()
        .messages({
            'string.empty': 'Bank account number is required',
            'string.pattern.base': 'Bank account number must be numeric',
            'string.min': 'Bank account number must be at least 9 digits',
            'string.max': 'Bank account number cannot exceed 18 digits',
        }),
    ifscCode: Joi.string()
        .length(11) // Standard IFSC code length
        .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/) // Format: 4 letters, 0, 6 alphanumeric
        .required()
        .messages({
            'string.empty': 'IFSC code is required',
            'string.pattern.base': 'Invalid IFSC code format',
            'string.length': 'IFSC code must be exactly 11 characters',
        }),
    bankName: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Bank name is required',
            'string.min': 'Bank name must be at least 3 characters',
            'string.max': 'Bank name cannot exceed 50 characters',
        }),
    accountHolderName: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[a-zA-Z\s]*$/) // Only alphabets and spaces
        .required()
        .messages({
            'string.empty': 'Account holder name is required',
            'string.pattern.base': 'Account holder name should only contain alphabets and spaces',
            'string.min': 'Account holder name must be at least 3 characters',
            'string.max': 'Account holder name cannot exceed 50 characters',
        }),
});