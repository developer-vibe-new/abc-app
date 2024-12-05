const { registerOperator, loginOperator, verifyOtpOperator } = require('./userVal');

exports.validateOperator = (req, res, next) => {
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

exports.validateloginOperator = (req, res, next) => {
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

exports.validateverifyOtpOperator = (req, res, next) => {
    const { error } = verifyOtpOperator.validate(req.body);

    if (error) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: error.details[0].message
        });
    }
    next();
};