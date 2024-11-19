const driverModel = require('../../models/providerModel');
const { statusCode, resMessage } = require('../../config/default.json');
const mongoose = require('mongoose');


exports.driverCreate = async (req) => {
    try {
        const { name, mobile, email, type } = req.body;
        const image = `${req.body.typeName}/${req.file.filename}`;
        if (!name || !mobile || !email || !type || !image) {
            return {
                statusCode: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Required_Data
            };
        }
        const createdData = await driverModel.create({
            name: name, mobile: mobile, email: email, type: type, image: image
        });
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data: createdData
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverView = async (req) => {
    try {
        var page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;

        let search_value = req.query.search || "";
        var conditions = [];

        if (search_value) {
            conditions.push({
                $match: {
                    name: { $regex: search_value, $options: "i" }
                }
            });
        }

        conditions.push({
            $addFields:
            {
                image: {
                    $concat: [
                        "http://192.168.0.18:6161/",
                        "$image"
                    ]
                }

            }
        });
        conditions.push(
            { $sort: { name: 1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );
        const viewAllData = await driverModel.aggregate(conditions);

        return {
            statusCode: statusCode.OK,
            success: true,
            data: viewAllData
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverUpdate = async ({ body, file }) => {
    try {
        // console.log(req.params, "jjjjjjjjj");
        // const body = req.body;
        body.image = file.filename;
        const updateData = await driverModel.findByIdAndUpdate(body.id, body, { new: true });
        if (!updateData) {
            return {
                success: false,
                message: "Error No Data Updated",
            };
        }

        return {
            success: true,
            message: resMessage.Data_Updated_Successfully,
            data: updateData
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.driverDelete = async (req) => {
    try {
        const deleteData = await driverModel.findByIdAndDelete({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (deleteData) {
            return {
                success: true,
                message: resMessage.Data_Deleted_Successfully,
                // data: deleteData
            };
        }
        // else {
        //     return {
        //         success: false,
        //         message: resMessage.Data_Deleted_Successfully,
        //     };
        // }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};