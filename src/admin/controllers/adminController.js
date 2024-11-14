
const services = require('../services/adminService');


exports.registerAdmin = async(req,res,next)=>{
    try {
        const data = await services.adminRegister(req);
        return res
          .status(200)
          .json(Object.assign({ success: data.status }, data));

    } catch (error) {
        console.log(error);
    }
};

exports.login = async(req,res,next)=>{
    try {
        const loginData = await services.login(req);
        return res
        .status(200)
        .json(Object.assign({ success: loginData.status}, loginData))
    } catch (error) {
        console.log(error);
    }
};
