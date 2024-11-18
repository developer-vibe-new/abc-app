const rentalModel = require("../../models/rentalModel");

exports.rentalList = async(req,res,next)=>{
    try {

        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;
        var conditions; 

        // let search_value = req.query.search || "";

        // if (search_value) {
        //     conditions = _.assign(conditions, { $or: [{ "state": { $regex: new RegExp(search_value, "gi") } }] });
        // }

        const rentalData = await rentalModel.find(conditions)
            .sort({createdAt:-1})
            .skip((page - 1) * pagesize).
            limit(pagesize);

        return {
            success:true,
            data:rentalData
        }
    } catch (error) {
        console.log(error)
    }
};

exports.editRental = async(req,res,next)=>{
    try {
        const body =req.body
        const editRentalData = await rentalModel.findByIdAndUpdate({_id:req.params.id},body,{new:true});
        console.log(editRentalData,"editRentalData")
        return {
            success:true,
            data:editRentalData
        }
    } catch (error) {
        console.log(error)
    }
};

exports.addRental = async(req,res,next)=>{
    try {
        
        const createRental = await rentalModel.create({
            packages:req.body
        })
        if(createRental){
            return {
                success:true,
                message:"Data Created Successfully",
                data:createRental
            }
        }
        return {
            success:false,
            message:"Data Not Created",
        }
    } catch (error) {
        console.log(error);
    }
};