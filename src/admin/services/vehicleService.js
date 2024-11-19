const vehicleModel = require('../../models/cars');
const taxiTypeModel = require('../../models/taxiTypeModel');



exports.vehicleList = async (req) => {
    try {
        var page = parseInt(req.query.page) || 1;
        var pagesize = parseInt(req.query.pagesize) || 10;
        let search_value = req.query.search_value || "";


        let pipeline = [];
        if (search_value) {
            pipeline.push({
                $match: {
                    title: { $regex: search_value, $options: "i" }
                }
            });
        }
        pipeline.push(
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * pagesize },
            { $limit: pagesize }
        );

        const vehicalView = await vehicleModel.aggregate(pipeline);


        return {
            success: true,
            data: vehicalView
        };

    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occurred while fetching vehicles Data."
        };
    }
};

exports.showVehicleType = async () => {
    try {
        const vehicleTypeList = await taxiTypeModel.find({}, { title: 1, _id: 1 });
        return {
            success: true,
            typeList: vehicleTypeList
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occurred while fetching vehicle type  Data."
        };
    }
};

exports.addVehicle = async (req) => {
    try {
        // console.log(req.body,"bbbbbbbb")
        const createData = await vehicleModel.create({
            type: req.body.type,
            title: req.body.title,
            make: req.body.make,
            model: req.body.model
        });
        if (createData) {
            return {
                success: true,
                message: "Vehicle Created Successfully",
                // data:createData
            };
        } else {
            return {
                success: false,
                message: "Vehicle Not Created",
                // data:createData
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "An error occurred while creating vehicles Data."
        };
    }
};
