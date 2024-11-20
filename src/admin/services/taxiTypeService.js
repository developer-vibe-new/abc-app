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
        conditions.push({
            $project: {
                icon: 1,
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
        const image = req.file.filename;
        const editData = await taxiTypeModel.findByIdAndUpdate({ _id: req.params.id }, { body, image }, { new: true });

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
        const updateData = await taxiTypeModel.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(req.body._id) }, { is_active: false }, { new: true });
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