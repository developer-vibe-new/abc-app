const driverModel = require('../../models/providerModel');
const { statusCode, resMessage } = require('../../config/default.json');
const mongoose = require('mongoose');

exports.driverCreate = async (req, res, next) => {
    try {
        const { name, mobile, email, type } = req.body;
        // console.log(req.file,"wwwwwwwwwwwwwwwwwwwwww")
        const image = req.file.filename
        // console.log(image,"uuuuuuuuuuuuu")
        if (!name || !mobile || !email || !type || !image) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const createdData = await driverModel.create({
             name:name, mobile:mobile, email:email, type:type, image:image });
             console.log(createdData,"createdData")
        return {
            success: true,
            message: resMessage.Data_Created_Successfully,
            data:createdData
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        }
    }
};

exports.driverView = async (req, res, next) => {
    try {
        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;

        let search_value = req.query.search || "";
        var conditions=[];

        if (search_value) {
            conditions.push({
                $match:{
                    name:{ $regex: search_value, $options: "i"}
                }
            })
        }
      
        conditions.push(
            { $sort: { name: 1 } },
            { $skip: (page - 1) * pagesize }, 
            { $limit: pagesize } 
        );
        const viewAllData = await driverModel.aggregate(conditions)
            
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data: viewAllData
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        }
    }
};

exports.driverUpdate = async (req, res, next) => {
    try {
        const body = req.body
        const image = req.file.filename
        const updateData = await driverModel.findByIdAndUpdate({ _id:new mongoose.Types.ObjectId( req.params.id) }, {body,image}, { new: true });
        if (updateData) {
            return {
                success: true,
                message: resMessage.Data_Created_Successfully,
                data: updateData
            }
        } else {
            return {
                success: false,
                message: "Error No Data Updated",
            }
        }
    } catch (error) {
        console.log(error)
    }
};

exports.driverDelete = async(req,res,next)=>{
    try {
        const deleteData = await driverModel.findByIdAndDelete({ _id:new mongoose.Types.ObjectId( req.params.id) });
        if (deleteData) {
            return {
                success: true,
                message: resMessage.Data_Deleted_Successfully,
                data: deleteData
            }
        } else {
            return {
                success: false,
                message: "Error No Data Deleted",
            }
        }
    } catch (error) {
        console.log(error)
    }
}