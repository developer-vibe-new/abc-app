const userModel = require('../../models/users');
const rideHistoryModel = require('../../models/adminModel');
const mongoose = require('mongoose');
const { statusCode, resMessage } = require('../../config/default.json');

exports.userListData = async (req) => {
    try {
        let pipeline = [];
        let search = req.params.search;
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;

        let skip = (page - 1) * limit;

        if(search) {
            pipeline.push({
                $match: {
                    $or: [
                        { first_name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } },
                        { mobile: { $regex: search, $options: 'i' } },
                    ]
                }
            });
        }

        pipeline.push({
            $project: {
              first_name: 1,
              last_name: 1,
              profile_image: 1,
              email: 1,
              mobile: 1,
              reg_date: {
                $dateToString: {
                  format: "%d-%m-%Y",
                  date: "$created"
                }
              },
              is_active: 1
            }
        });

        pipeline.push({
            $skip: skip
        });
        pipeline.push({
            $limit: limit
        });

        const userData = await userModel.aggregate(pipeline);

        if (!userData) {
            return {
                status: statusCode.DATA_NOT_FOUND,
                success: false,
                message: resMessage.Data_Not_Found
            };
        }

        const totalRecords = await userModel.countDocuments();

        return {
            status: statusCode.OK,
            success: true,
            message: resMessage.Data_Retrieved_Successfully,
            data: userData,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalRecords / limit),
                totalRecords: totalRecords
            }
        };
    } catch (error) {
        return {
            success: false,
            message: resMessage.Internal_Server_Error,
            error: error.message || "Internal Server Error",
        };
    }
};

exports.updateUserStatus = async (req) => {
    try {
        const updateData = await userModel.findByIdAndUpdate({ _id: req.body._id }, { is_active: false }, { new: true });
        if (updateData) {
            return {
                success: true,
                data: updateData
            };
        } else {
            return {
                success: false
            };
        }
    } catch (error) {
        console.log(error);
    }
};


exports.viewUserRideHistory = async (req) => {
    try {
        const userRideData = await rideHistoryModel.findById({ userId: new mongoose.Types.ObjectId(req.params.id) });
        if (userRideData) {
            return {
                success: true,
                data: userRideData
            };
        } else {
            return {
                success: true,
            };
        }
    } catch (error) {
        console.log(error);
    }
};

