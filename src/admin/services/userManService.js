const userModel = require('../../models/users');
const rideHistoryModel = require('../../models/adminModel') // DEFINE THE RIDER MODEL 


exports.userListData = async (req, res, next) => {
    try {
        const userData = await userModel.find({});
        if (userData) {
            return {
                success: true,
                data: userData
            }
        } else {
            return {
                success: false,
            }
        }
    } catch (error) {
        console.log(error);
    }
};


exports.updateUserStatus = async (req, res, next) => {
    try {
        const updateData = await userModel.findByIdAndUpdate({_id:req.body.id},{is_active:false},{new:true});
        if(updateData){
            return {
                success:true,
                data:updateData
            }
        } else {
            return {
                success:false
            }
        }
    } catch (error) {
        console.log(error);
    }
};


exports.viewUserRideHistory = async (req, res, next) => {
    try {
        console.log(req.params,"wwwwwwwwww")
        const userRideData = await rideHistoryModel.findById({userId:new mongoose.Types.ObjectId(req.params.id)});
        if(userRideData){
            return {
                success:true,
                data:userRideData
            }
        } else {
            return {
                success:true,
            }
        }
    } catch (error) {
        console.log(error);
    }
};

