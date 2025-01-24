const { statusCode, resMessage } = require('../../config/default.json');
const OfferCode = require('../../models/offerCodeModel');
const Admin = require('../../models/adminModel');

exports.addOfferCode = async (req) => {
    try {
        const { offercode, ride_type, description, start_date, end_date, percentage, price, usedtimes, city_id } = req.body;
        // if (!offercode || !ride_type || !description || !city_id || !start_date || !end_date || !percentage || !price || !usedtimes) {
        //     return {
        //         status: statusCode.BAD_REQUEST,
        //         success: false,
        //         message: resMessage.Required_Data
        //     }
        // }
        const data = await OfferCode.create({ offercode, ride_type, city_id, description, start_date, end_date, percentage, price, usedtimes });
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Created_Successfully,
            data
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}

exports.viewOfferCode = async (req) => {
    try {
        const adminData = await Admin.findById(req.auth._id);
        let search = req.query.search;
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        let skip = (page - 1) * limit;
        let pipeline = [];
        if(search) {
            pipeline.push(
                {
                    $match: {
                        offercode: { $regex: search, $options: 'i' }
                    }
                }
            );
        }
        pipeline.push(
            {
                $match: {
                    city_id: adminData.city_id
                }
            }
        );
        pipeline.push(
            {
                $project: {
                  offercode: 1,
                  start_date: 1,
                  end_date: 1,
                  usedtimes: 1,
                  price: 1,
                  percentage: 1
                }
            }
        );
        pipeline.push(
            { $skip: skip },
            { $limit: limit }
        );
        const data = await OfferCode.aggregate(pipeline);
        const totalCount = await OfferCode.countDocuments();
        if(!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Retrieved_Successfully,
            data,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            }
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}

exports.getEditOfferCode = async (req) => {
    try {
        const { id } = req.params;
        const data = await OfferCode.findById(id);
        if(!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Retrieved_Successfully,
            data
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}

exports.updateOfferCode = async (req) => {
    try {
        const { id } = req.params;
        const { offercode, description, start_date, end_date, ride_type, percentage, price, usedtimes } = req.body;
        const data = await OfferCode.findById(id);
        if(!data) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            }
        }
        await OfferCode.findByIdAndUpdate(id, {
            offercode, description, start_date, end_date, ride_type, percentage, price, usedtimes
        });
        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Updated_Successfully
        }
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
}