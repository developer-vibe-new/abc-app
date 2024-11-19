const userModel = require('../../models/users');
const rideHistoryModel = require('../../models/adminModel'); // DEFINE THE RIDER MODEL 
const mongoose = require('mongoose');


exports.userListData = async () => {
    try {
        const userData = await userModel.find({});
        if (userData) {
            return {
                success: true,
                data: userData
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

