
const services = require('../services/adminService');


exports.registerAdmin = async(req,res,next)=>{
    try {
        const data = await services.adminRegister(req);
        return res
          .status(200)
          .json(Object.assign({ status: data.success }, data));

    } catch (error) {
        console.log(error);
    }
};

exports.login = async(req,res,next)=>{
    try {
        const loginData = await services.login(req);
        return res
        .status(200)
        .json(Object.assign({ status: loginData.success}, loginData))
    } catch (error) {
        console.log(error);
    }
};

exports.operators = async(req,res,next)=>{
    try {
        const operatorData = await services.operatorsList(req);
        if(operatorData.success == true){
            return res
            .status(200)
            .json(Object.assign({ status: operatorData.success}, operatorData))
        }
        return res
        .status(404)
        .json(Object.assign({status: operatorData.success}))
    } catch (error) {
        console.log(error)
    }
};
exports.operatorsUpdate = async(req,res,next)=>{
    try {
        const data = await services.updateOperator(req);
        if(data.success == true){
            return res
            .status(200)
            .json(Object.assign({ status: data.success}, data))
        }
    } catch (error) {
        console.log(error);
    }
}
