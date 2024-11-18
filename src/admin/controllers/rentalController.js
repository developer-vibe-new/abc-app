const services = require("../services/rentalService");


exports.rentalListData = async(req,res,next)=>{
    try {
        const data = await services.rentalList(req)
        return res.status(200).json(Object.assign({status:data.success}, data));
    } catch (error) {
        console.log(error);
    }
};
exports.rentalEditData = async(req,res,next)=>{
    try {
        const data = await services.editRental(req);
        return res.status(200).json(Object.assign({status:data.success},data))
    } catch (error) {
        console.log(error);
    }
};
exports.createRental =  async(req,res,next)=>{
    try {
        const data = await services.addRental(req);
        if(data.success == true){
            return res.status(200).json(Object.assign({status:data.success},data))
        } else {
            return res.status(400).json(Object.assign({status:data.success,message:data.message}))
        }
    } catch (error) {
        console.log(error);
    }
}