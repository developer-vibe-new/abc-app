const services = require('../services/userManService');


exports.userListing = async(req,res,next)=>{
    try {
        const data = await services.userListData(req);
        if(data.success == true){
            return res.status(200).json(Object.assign({status:data.success}));
        } else {
            return res.status(400).json(Object.assign({status:data.success}));
        }
    } catch (error) {
        console.log(error);
    }
};

exports.updateStatusUser = async(req,res,next)=>{
    try {
        const data = await services.updateUserStatus(req);
        if(data.success == true){
            return res.status(200).json(Object.assign({status:data.success}));
        } else {
            return res.status(400).json(Object.assign({status:data.success}));
        }
    } catch (error) {
        console.log(error);
    }
};

exports.userRideingDetails = async(req,res,next)=>{
    try {
        const data = await services.viewUserRideHistory(req);
        if(data.success == true){
            return res.status(200).json(Object.assign({status:data.success},data));
        } else {
            return res.status(400).json(Object.assign({status:data.success}));
        }
    } catch (error) {
        console.log(error);
    }
}