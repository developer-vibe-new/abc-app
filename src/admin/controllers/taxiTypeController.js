const services = require('../services/taxiTypeSercice');

exports.viewTaxiType = async (req) => {
    try {
        return await services.taxiTypeList(req);
        // if (data.success == true) {
        //     return res.status(200).json(Object.assign({ status: data.success }, data));
        // } else {
        //     return res.status(400).json(Object.assign({ status: data.success }));
        // }
    } catch (error) {
        console.log(error);
    }
};
exports.updateTaxiType = async (req) => {
    try {
        return await services.updateTaxiTypeList(req);
        // if (data.success == true) {
        //     return res.status(200).json(Object.assign({ status: data.success }, data));
        // } else {
        //     return res.status(400).json(Object.assign({ status: data.success }));
        // }
    } catch (error) {
        console.log(error);
    }
};

exports.updateTaxiStatus = async (req) => {
    try {
        return await services.updateTaxiStatus(req);
        // if (data.success == true) {
        //     return res.status(200).json(Object.assign({ status: data.success }, data));
        // } else {
        //     return res.status(400).json(Object.assign({ status: data.success }));
        // }
    } catch (error) {
        console.log(error);
    }
};
