const services = require('../services/taxiTypeSercice');

exports.viewTaxiType = async(req,res,next)=>{
    try {
        const data = await services.taxiTypeList(req);
        if(data.success == true){
            return res.status(200).json(Object.assign({ status: data.success }, data))
        }else {
            return res.status(400).json(Object.assign({ status: data.success }))
        }
    } catch (error) {
        console.log(error);
    }
};
exports.updateTaxiType = async(req,res,next)=>{
    try {
        const data = await services.updateTaxiTypeList(req);
        if(data.success == true){
            return res.status(200).json(Object.assign({ status: data.success }, data))
        }else {
            return res.status(400).json(Object.assign({ status: data.success }))
        }
    } catch (error) {
        console.log(error);
    }
};

exports.updateTaxiStatus = async(req,res,next)=>{
    try {
        const data = await services.updateTaxiStatus(req);
        if(data.success == true){
            return res.status(200).json(Object.assign({ status: data.success }, data))
        }else {
            return res.status(400).json(Object.assign({ status: data.success }))
        }
    } catch (error) {
        console.log(error)
    }
};
