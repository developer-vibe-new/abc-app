const driverModel = require('../../models/driverModel');



exports.driverCreate= async(req,res,next)=>{
    try {
        const findDriver = await driverModel.find({});
        if(findDriver.length > 0) {
            return {
                success :false,
                message :"Driver Already Exits"
            }
        }
        const addDriver = await driverModel.create({
            first_name:req.body.first_name,
            last_name:res.body.last_name,
            full_name:req.body.full_name,
            email:req.body.email,
            mobile:req.body.mobile,
            callingmobile:req.body.callingmobile,
            country_code:req.body.country_code,
            password:req.body.password,
            city_id:req.body.city_id
        });
        if(addDriver){
            return {
                success :true,
                message :"Driver Added successfully",
                data:addDriver
            }
        }
    } catch (error) {
        console.log(error);
    }
}