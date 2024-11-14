const services = require('../services/driverService');


exports.createDriver = async(req,res,next)=>{
    try {
        const driverData = await services.driverCreate(req);
        if(driverData.success==true){
            return res.status(200).json(Object.assign({status:driverData.success},driverData))
        }
    } catch (error) {
        console.log(error);
    }
}