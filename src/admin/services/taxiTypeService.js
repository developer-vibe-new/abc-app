const taxiTypeModel = require('../../models/taxiTypeModel');
const mongoose = require('mongoose');
const { statusCode, resMessage } = require('../../config/default.json');

exports.taxiTypeList = async (req) => {
    try {
        let page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;
        let search_value = req.query.search || "";
        var conditions = [];

        if (search_value) {
            conditions.push({
                $match: {
                    title: { $regex: search_value, $options: "i" }
                }
            });
        }

        conditions.push();

        conditions.push({
            $project: {
                    icon: {
                        $concat: [
                            "http://192.168.0.18:6161/taxiType/",
                            "$icon"
                        ]
                    },
                    title: 1,
                    currency: 1,
                    base_fare: 1,
                    time_fare: 1,
                    distance_fare: 1,
                    airportCharge: 1,
                    outstation_distance_fare: 1,
                    outstation_two_distance_fare: 1,
                    rental_distance_fare: 1,
                    is_active: 1,
                    outstation_status: 1
            }
        });
        conditions.push(
            { $sort: { title: 1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );
        const findTaxi = await taxiTypeModel.aggregate(conditions);
        return {
            statusCode: statusCode.OK,
            success: true,
            message: resMessage.Data_Fetch_Successfully,
            data: findTaxi
        };
        // }
    } catch (error) {
        console.log(error);
    }
};
exports.updateTaxiTypeList = async (req) => {
    try {
        const body = req.body;
        if (req.file) {

            body.image = req.file.filename;
        }
        const editData = await taxiTypeModel.findByIdAndUpdate({ _id: req.params.id }, body, { new: true });

        if (editData) {
            return {
                success: true,
                message: "Data Updated Successfully",
                data: editData
            };
        } else {
            return {
                success: false,
                message: "Data Not Updated"
            };
        }
    } catch (error) {
        console.log(error);
    }
};

exports.updateTaxiStatus = async (req) => {
    try {
        const updateData = await taxiTypeModel.findById(req.body.id);
        if(!updateData) {
            return {
                status: statusCode.BAD_REQUEST,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        const updateStatus = updateData.is_active === true ? false : true;
        updateData.is_active = updateStatus;
        await updateData.save();
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully
        }
    } catch (error) {
        console.log(error);
    }
};
exports.updateTaxiOutstationStatus = async (req) => {
    try {
        const updateData = await taxiTypeModel.findById({ _id: new mongoose.Types.ObjectId(req.body._id) });
        if (updateData) {
            updateData.outstation_status = !updateData.outstation_status;
            await updateData.save();
        }
        if (updateData) {
            return {
                success: true,
                data: updateData
            };
        } else {
            return {
                success: false,
            };
        }
    } catch (error) {
        console.log(error);
    }
};