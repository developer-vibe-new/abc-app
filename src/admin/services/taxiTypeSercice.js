const taxiTypeModel = require('../../models/taxiTypeModel');
const mongoose = require('mongoose');

exports.taxiTypeList = async (req) => {
    try {
        let page = req.query.page || 1;
        let pagesize = req.query.pagesize || 10;
        let search_value = req.query.search || "";
        var conditions = [];

        if (search_value) {
            conditions.push({
                $match: {
                    state: { $regex: search_value, $options: "i" }
                }
            });
        }
        conditions.push(
            { $sort: { title: 1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );
        const findTaxi = await taxiTypeModel.aggregate(conditions);
        // .sort({ title: 1 })
        // .skip((page - 1) * pagesize).
        // limit(pagesize);
        if (findTaxi.length == 0) {
            return {
                success: false,
                message: "No Data Found",

            };
        } else {
            return {
                success: true,
                data: findTaxi
            };
        }
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