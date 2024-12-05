const { registerOperator, loginOperator } = require('./userVal');

const validateOperator = (req, res, next) => {
    const { error } = registerOperator.validate(req.body);

    if (error) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

const validateloginOperator = (req, res, next) => {
    const { error } = loginOperator.validate(req.body);

    if (error) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

module.exports = { validateOperator, validateloginOperator };
