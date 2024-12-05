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